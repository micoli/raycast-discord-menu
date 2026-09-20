(function() {
  "use strict";
  const discordSelectorLabels = {
    stopStreaming: "Arrêter de streamer",
    shareYourScreen: "Partage ton écran",
    mute: "Rendre muet",
    noSpeaker: "Mettre en sourdine"
  };
  const SCREEN_TAB_INDEX = 1;
  const findByAriaLabel = (label) => document.querySelector(`[aria-label="${label}"]`);
  const findActionButton = (tooltipLabel, fallbackIndex) => {
    const buttons = Array.from(document.querySelectorAll('[class*="actionButtons_"] > button'));
    const byTooltip = buttons.find((button) => {
      var _a;
      const tooltipId = button.getAttribute("aria-describedby");
      return tooltipId && ((_a = document.getElementById(tooltipId)) == null ? void 0 : _a.textContent) === tooltipLabel;
    });
    return byTooltip ?? buttons[fallbackIndex] ?? null;
  };
  const findScreenPickerTab = () => {
    const dialog = document.querySelector('[role="dialog"]');
    return (dialog == null ? void 0 : dialog.querySelectorAll('[role="tab"]')[SCREEN_TAB_INDEX]) ?? null;
  };
  const findScreenPickerTile = (screenIndex) => {
    const dialog = document.querySelector('[role="dialog"]');
    return (dialog == null ? void 0 : dialog.querySelectorAll('[class*="source__"]')[screenIndex - 1]) ?? null;
  };
  const dismissDialog = () => {
    ["keydown", "keyup"].forEach(
      (type) => document.dispatchEvent(
        new KeyboardEvent(type, { key: "Escape", code: "Escape", keyCode: 27, bubbles: true, cancelable: true })
      )
    );
  };
  const isConnectedToVoice = () => document.querySelector('[class*="actionButtons_"]') !== null;
  const currentUserName = () => {
    var _a, _b;
    return (_b = (_a = document.querySelector('[class*="panels_"] [class*="nameTag_"] [class*="title_"]')) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
  };
  const readChannelName = (channelItem) => {
    var _a;
    const label = (_a = channelItem.querySelector('a[data-list-item-id^="channels___"]')) == null ? void 0 : _a.getAttribute("aria-label");
    return label == null ? void 0 : label.split(",")[0].replace(/\s*\([^)]*\)$/, "");
  };
  const readMembers = (channelItem) => {
    const members = /* @__PURE__ */ new Map();
    channelItem.querySelectorAll('[class*="voiceUser"]').forEach((voiceUser) => {
      var _a, _b, _c;
      const name = (_a = voiceUser.querySelector('[role="button"][aria-label]')) == null ? void 0 : _a.getAttribute("aria-label");
      if (!name || members.has(name)) {
        return;
      }
      const avatarStyle = (_b = voiceUser.querySelector('[class*="avatar"]')) == null ? void 0 : _b.style.backgroundImage;
      members.set(name, { name, avatarUrl: (_c = avatarStyle == null ? void 0 : avatarStyle.match(/url\("?([^")]+)/)) == null ? void 0 : _c[1] });
    });
    return Array.from(members.values());
  };
  const readConnectedVoiceChannel = () => {
    if (!isConnectedToVoice()) {
      return null;
    }
    const channelsWithMembers = Array.from(document.querySelectorAll("li")).filter((item) => item.querySelector('[class*="voiceUser"]')).map((item) => ({ channel: readChannelName(item), members: readMembers(item) })).filter((state) => Boolean(state.channel) && state.members.length > 0);
    const me = currentUserName();
    const containingMe = channelsWithMembers.find((state) => state.members.some((member) => member.name === me));
    if (containingMe) {
      return containingMe;
    }
    return channelsWithMembers.length === 1 ? channelsWithMembers[0] : null;
  };
  const waitFor = (find, description, timeoutMs = 5e3) => {
    return new Promise((resolve, reject) => {
      const initial = find();
      if (initial) {
        return resolve(initial);
      }
      const observer = new MutationObserver(() => {
        const found = find();
        if (!found) {
          return;
        }
        clearTimeout(timeout);
        observer.disconnect();
        resolve(found);
      });
      const timeout = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${description}`));
      }, timeoutMs);
      observer.observe(document.body, { childList: true, subtree: true });
    });
  };
  const SHARE_BUTTON_FALLBACK_INDEX = 1;
  class DiscordExecutor {
    run(message) {
      switch (message.type) {
        case "startScreenShare":
          return this.startScreenShare(message.screenIndex ?? 1);
        case "stopScreenShare":
          return this.stopScreenShare();
        case "toggleMicrophone":
          return this.clickSwitch(discordSelectorLabels.mute);
        case "muteMicrophone":
          return this.clickSwitch(discordSelectorLabels.mute, false);
        case "unmuteMicrophone":
          return this.clickSwitch(discordSelectorLabels.mute, true);
        case "toggleSpeaker":
          return this.clickSwitch(discordSelectorLabels.noSpeaker);
        case "deafen":
          return this.clickSwitch(discordSelectorLabels.noSpeaker, false);
        case "undeafen":
          return this.clickSwitch(discordSelectorLabels.noSpeaker, true);
        case "getVoiceMembers":
          return readConnectedVoiceChannel();
        default:
          throw new Error(`Unknown message ${JSON.stringify(message)}`);
      }
    }
    async startScreenShare(screenIndex) {
      const shareButton = findActionButton(discordSelectorLabels.shareYourScreen, SHARE_BUTTON_FALLBACK_INDEX);
      if (!shareButton) {
        throw new Error("Share button not found, is discord connected to a voice channel?");
      }
      if (shareButton.getAttribute("aria-pressed") === "true") {
        return;
      }
      shareButton.click();
      const screenTab = await waitFor(findScreenPickerTab, "screen picker tab");
      screenTab.click();
      await waitFor(
        () => screenTab.getAttribute("aria-selected") === "true" ? screenTab : null,
        "screen tab selection"
      );
      const tile = await waitFor(() => findScreenPickerTile(screenIndex), `screen ${screenIndex} tile`).catch(() => {
        dismissDialog();
        throw new Error(`Screen ${screenIndex} not available in the picker`);
      });
      tile.click();
    }
    async stopScreenShare() {
      var _a;
      (_a = findByAriaLabel(discordSelectorLabels.stopStreaming)) == null ? void 0 : _a.click();
    }
    // aria-checked=true means muted / deafened. With requiredState, click only if the switch is currently in that state
    clickSwitch(label, requiredState) {
      const button = findByAriaLabel(label);
      if (!button) {
        throw new Error(`Button not found: ${label}`);
      }
      const isChecked = button.getAttribute("aria-checked") === "true";
      if (requiredState !== void 0 && isChecked !== requiredState) {
        return;
      }
      button.click();
    }
  }
  document.discordExecutor = new DiscordExecutor();
})();
