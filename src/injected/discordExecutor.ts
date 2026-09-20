import { discordSelectorLabels } from "./aria-labels";
import {
  dismissDialog,
  findActionButton,
  findByAriaLabel,
  findScreenPickerTab,
  findScreenPickerTile,
  readConnectedVoiceChannel,
} from "./discord-dom";
import type { DiscordMessage } from "./messages";
import { waitFor } from "./robot";

const SHARE_BUTTON_FALLBACK_INDEX = 1;

export class DiscordExecutor {
  run(message: DiscordMessage) {
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

  async startScreenShare(screenIndex: number) {
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
      () => (screenTab.getAttribute("aria-selected") === "true" ? screenTab : null),
      "screen tab selection",
    );

    const tile = await waitFor(() => findScreenPickerTile(screenIndex), `screen ${screenIndex} tile`).catch(() => {
      dismissDialog();
      throw new Error(`Screen ${screenIndex} not available in the picker`);
    });
    tile.click();
  }

  async stopScreenShare() {
    findByAriaLabel(discordSelectorLabels.stopStreaming)?.click();
  }

  // aria-checked=true means muted / deafened. With requiredState, click only if the switch is currently in that state
  private clickSwitch(label: string, requiredState?: boolean) {
    const button = findByAriaLabel(label);
    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }
    const isChecked = button.getAttribute("aria-checked") === "true";
    if (requiredState !== undefined && isChecked !== requiredState) {
      return;
    }
    button.click();
  }
}
