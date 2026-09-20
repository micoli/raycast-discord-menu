import { Image } from "@raycast/api";
import type { DiscordState } from "./injected/messages";

const MAX_DISPLAYED_COUNT = 9;

const flag = (value: boolean) => (value ? "1" : "0");

const countName = (state: DiscordState) => {
  const count = state.voice?.members.length ?? 0;
  if (count === 0) {
    return "none";
  }
  return count > MAX_DISPLAYED_COUNT ? "many" : String(count);
};

export const menuIcon = (state?: DiscordState): Image.ImageLike => {
  if (!state) {
    return "menu-icons/offline.png";
  }
  return `menu-icons/${flag(state.muted)}${flag(state.deafened)}${flag(state.sharing)}-${countName(state)}.png`;
};
