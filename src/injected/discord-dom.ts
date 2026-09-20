import { discordSelectorLabels } from "./aria-labels";
import type { DiscordState, VoiceChannelState } from "./messages";

const SCREEN_TAB_INDEX = 1;
const SHARE_BUTTON_FALLBACK_INDEX = 1;

export const findByAriaLabel = (label: string) => document.querySelector<HTMLElement>(`[aria-label="${label}"]`);

// Discord dropped the aria-label on these icon buttons, the label now lives in the tooltip referenced by aria-describedby
export const findActionButton = (tooltipLabel: string, fallbackIndex: number) => {
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('[class*="actionButtons_"] > button'));
  const byTooltip = buttons.find((button) => {
    const tooltipId = button.getAttribute("aria-describedby");
    return tooltipId && document.getElementById(tooltipId)?.textContent === tooltipLabel;
  });
  return byTooltip ?? buttons[fallbackIndex] ?? null;
};

export const findShareButton = () =>
  findActionButton(discordSelectorLabels.shareYourScreen, SHARE_BUTTON_FALLBACK_INDEX);

export const findScreenPickerTab = () => {
  const dialog = document.querySelector('[role="dialog"]');
  return dialog?.querySelectorAll<HTMLElement>('[role="tab"]')[SCREEN_TAB_INDEX] ?? null;
};

export const findScreenPickerTile = (screenIndex: number) => {
  const dialog = document.querySelector('[role="dialog"]');
  return dialog?.querySelectorAll<HTMLElement>('[class*="source__"]')[screenIndex - 1] ?? null;
};

export const dismissDialog = () => {
  ["keydown", "keyup"].forEach((type) =>
    document.dispatchEvent(
      new KeyboardEvent(type, { key: "Escape", code: "Escape", keyCode: 27, bubbles: true, cancelable: true }),
    ),
  );
};

const isConnectedToVoice = () => document.querySelector('[class*="actionButtons_"]') !== null;

const currentUserName = () =>
  document.querySelector('[class*="panels_"] [class*="nameTag_"] [class*="title_"]')?.textContent?.trim();

const readChannelName = (channelItem: Element) => {
  const label = channelItem.querySelector('a[data-list-item-id^="channels___"]')?.getAttribute("aria-label");
  return label?.split(",")[0].replace(/\s*\([^)]*\)$/, "");
};

const readMembers = (channelItem: Element) => {
  const members = new Map<string, { name: string; avatarUrl?: string }>();
  channelItem.querySelectorAll('[class*="voiceUser"]').forEach((voiceUser) => {
    // The aria-label carries the state too ("name, Muet"), the username element does not
    const name =
      voiceUser.querySelector('[class*="username__"]')?.textContent?.trim() ||
      voiceUser.querySelector('[role="button"][aria-label]')?.getAttribute("aria-label")?.split(",")[0];
    if (!name || members.has(name)) {
      return;
    }
    const avatarStyle = voiceUser.querySelector<HTMLElement>('[class*="avatar"]')?.style.backgroundImage;
    members.set(name, { name, avatarUrl: avatarStyle?.match(/url\("?([^")]+)/)?.[1] });
  });
  return Array.from(members.values());
};

export const readConnectedVoiceChannel = (): VoiceChannelState | null => {
  if (!isConnectedToVoice()) {
    return null;
  }

  const channelsWithMembers = Array.from(document.querySelectorAll("li"))
    .filter((item) => item.querySelector('[class*="voiceUser"]'))
    .map((item) => ({ channel: readChannelName(item), members: readMembers(item) }))
    .filter((state): state is VoiceChannelState => Boolean(state.channel) && state.members.length > 0);

  const me = currentUserName();
  const containingMe = channelsWithMembers.find((state) => state.members.some((member) => member.name === me));
  if (containingMe) {
    return containingMe;
  }
  return channelsWithMembers.length === 1 ? channelsWithMembers[0] : null;
};

const isSwitchChecked = (label: string) => findByAriaLabel(label)?.getAttribute("aria-checked") === "true";

export const readDiscordState = (): DiscordState => ({
  muted: isSwitchChecked(discordSelectorLabels.mute),
  deafened: isSwitchChecked(discordSelectorLabels.noSpeaker),
  sharing: findShareButton()?.getAttribute("aria-pressed") === "true",
  voice: readConnectedVoiceChannel(),
});
