import { vi } from "vitest";

export const environment = {
  assetsPath: "",
  supportPath: "",
  ownerOrAuthorName: "owner",
  extensionName: "extension",
};

export const showHUD = vi.fn();
export const closeMainWindow = vi.fn();
