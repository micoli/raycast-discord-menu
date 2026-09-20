var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function() {
  "use strict";
  var _a, _b;
  const discordSelectorLabels = {
    stopStreaming: "Arrêter de streamer",
    shareYourScreen: "Partage ton écran",
    mute: "Rendre muet",
    noSpeaker: "Mettre en sourdine"
  };
  const SCREEN_TAB_INDEX = 1;
  const SHARE_BUTTON_FALLBACK_INDEX = 1;
  const findByAriaLabel = (label) => document.querySelector(`[aria-label="${label}"]`);
  const findActionButton = (tooltipLabel, fallbackIndex) => {
    const buttons = Array.from(document.querySelectorAll('[class*="actionButtons_"] > button'));
    const byTooltip = buttons.find((button) => {
      var _a2;
      const tooltipId = button.getAttribute("aria-describedby");
      return tooltipId && ((_a2 = document.getElementById(tooltipId)) == null ? void 0 : _a2.textContent) === tooltipLabel;
    });
    return byTooltip ?? buttons[fallbackIndex] ?? null;
  };
  const findShareButton = () => findActionButton(discordSelectorLabels.shareYourScreen, SHARE_BUTTON_FALLBACK_INDEX);
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
    var _a2, _b2;
    return (_b2 = (_a2 = document.querySelector('[class*="panels_"] [class*="nameTag_"] [class*="title_"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim();
  };
  const readChannelName = (channelItem) => {
    var _a2;
    const label = (_a2 = channelItem.querySelector('a[data-list-item-id^="channels___"]')) == null ? void 0 : _a2.getAttribute("aria-label");
    return label == null ? void 0 : label.split(",")[0].replace(/\s*\([^)]*\)$/, "");
  };
  const readMembers = (channelItem) => {
    const members = /* @__PURE__ */ new Map();
    channelItem.querySelectorAll('[class*="voiceUser"]').forEach((voiceUser) => {
      var _a2, _b2, _c, _d, _e, _f;
      const name = ((_b2 = (_a2 = voiceUser.querySelector('[class*="username__"]')) == null ? void 0 : _a2.textContent) == null ? void 0 : _b2.trim()) || ((_d = (_c = voiceUser.querySelector('[role="button"][aria-label]')) == null ? void 0 : _c.getAttribute("aria-label")) == null ? void 0 : _d.split(",")[0]);
      if (!name || members.has(name)) {
        return;
      }
      const avatarStyle = (_e = voiceUser.querySelector('[class*="avatar"]')) == null ? void 0 : _e.style.backgroundImage;
      members.set(name, { name, avatarUrl: (_f = avatarStyle == null ? void 0 : avatarStyle.match(/url\("?([^")]+)/)) == null ? void 0 : _f[1] });
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
  const isSwitchChecked = (label) => {
    var _a2;
    return ((_a2 = findByAriaLabel(label)) == null ? void 0 : _a2.getAttribute("aria-checked")) === "true";
  };
  const readDiscordState = () => {
    var _a2;
    return {
      connected: isConnectedToVoice(),
      muted: isSwitchChecked(discordSelectorLabels.mute),
      deafened: isSwitchChecked(discordSelectorLabels.noSpeaker),
      sharing: ((_a2 = findShareButton()) == null ? void 0 : _a2.getAttribute("aria-pressed")) === "true",
      voice: readConnectedVoiceChannel()
    };
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
  const CHECK_THROTTLE_MS = 300;
  const MIN_NOTIFY_INTERVAL_MS = 1e3;
  const startStateWatcher = () => {
    let lastState = JSON.stringify(readDiscordState());
    let lastNotifiedAt = 0;
    let pendingCheck;
    const check = () => {
      var _a2;
      pendingCheck = void 0;
      const current = JSON.stringify(readDiscordState());
      if (current === lastState) {
        return;
      }
      const sinceLastNotification = Date.now() - lastNotifiedAt;
      if (sinceLastNotification < MIN_NOTIFY_INTERVAL_MS) {
        pendingCheck = setTimeout(check, MIN_NOTIFY_INTERVAL_MS - sinceLastNotification);
        return;
      }
      lastState = current;
      lastNotifiedAt = Date.now();
      (_a2 = window.notifyRaycast) == null ? void 0 : _a2.call(window, "stateChanged");
    };
    const observer = new MutationObserver(() => {
      pendingCheck ?? (pendingCheck = setTimeout(check, CHECK_THROTTLE_MS));
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-checked", "aria-pressed"]
    });
    return () => {
      observer.disconnect();
      clearTimeout(pendingCheck);
    };
  };
  class DiscordExecutor {
    constructor() {
      // Set by raycast right after the injection, a different value means the bundle is outdated
      __publicField(this, "bundleVersion");
      __publicField(this, "watching", false);
      __publicField(this, "stopWatching");
    }
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
        case "getState":
          return readDiscordState();
        case "watchState":
          return this.watchState();
        default:
          throw new Error(`Unknown message ${JSON.stringify(message)}`);
      }
    }
    watchState() {
      var _a2;
      (_a2 = this.stopWatching) == null ? void 0 : _a2.call(this);
      this.stopWatching = startStateWatcher();
      this.watching = true;
    }
    dispose() {
      var _a2;
      (_a2 = this.stopWatching) == null ? void 0 : _a2.call(this);
      this.watching = false;
    }
    async startScreenShare(screenIndex) {
      const shareButton = findShareButton();
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
      var _a2;
      (_a2 = findByAriaLabel(discordSelectorLabels.stopStreaming)) == null ? void 0 : _a2.click();
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
  (_b = (_a = document.discordExecutor) == null ? void 0 : _a.dispose) == null ? void 0 : _b.call(_a);
  document.discordExecutor = new DiscordExecutor();
})();
