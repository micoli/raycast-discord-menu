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
      case "setMicrophoneOn":
        return this.clickSwitch(discordSelectorLabels.mute, true);
      case "setMicrophoneOff":
        return this.clickSwitch(discordSelectorLabels.mute, false);
      case "toggleSpeaker":
        return this.clickSwitch(discordSelectorLabels.noSpeaker);
      case "setSpeakerOn":
        return this.clickSwitch(discordSelectorLabels.noSpeaker, true);
      case "setSpeakerOff":
        return this.clickSwitch(discordSelectorLabels.noSpeaker, false);
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

  // For a switch, aria-checked=true means the feature is active (muted / deafened)
  private clickSwitch(label: string, onlyWhenChecked?: boolean) {
    const button = findByAriaLabel(label);
    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }
    const isChecked = button.getAttribute("aria-checked") === "true";
    if (onlyWhenChecked !== undefined && isChecked !== onlyWhenChecked) {
      return;
    }
    button.click();
  }
}
