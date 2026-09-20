import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DiscordState } from "../src/injected/messages";
import { menuIcon } from "../src/menu-icon";

const ICONS_DIRECTORY = path.resolve("assets");

const stateWith = (members: number, flags: Partial<DiscordState> = {}): DiscordState => ({
  connected: true,
  muted: false,
  deafened: false,
  sharing: false,
  voice: members
    ? { channel: "General", members: Array.from({ length: members }, (_, index) => ({ name: `user${index}` })) }
    : null,
  ...flags,
});

describe("menuIcon", () => {
  it("is the offline icon while the state is unknown", () => {
    expect(menuIcon(undefined)).toBe("menu-icons/offline.png");
  });

  it("encodes muted, deafened and sharing, then the member count", () => {
    expect(menuIcon(stateWith(1))).toBe("menu-icons/000-1.png");
    expect(menuIcon(stateWith(3, { muted: true }))).toBe("menu-icons/100-3.png");
    expect(menuIcon(stateWith(2, { deafened: true }))).toBe("menu-icons/010-2.png");
    expect(menuIcon(stateWith(5, { sharing: true }))).toBe("menu-icons/001-5.png");
    expect(menuIcon(stateWith(4, { muted: true, deafened: true, sharing: true }))).toBe("menu-icons/111-4.png");
  });

  it("shows no count outside a voice channel", () => {
    expect(menuIcon(stateWith(0, { connected: false }))).toBe("menu-icons/000-none.png");
  });

  it("caps the count", () => {
    expect(menuIcon(stateWith(9))).toBe("menu-icons/000-9.png");
    expect(menuIcon(stateWith(10))).toBe("menu-icons/000-many.png");
    expect(menuIcon(stateWith(42))).toBe("menu-icons/000-many.png");
  });
});

describe("menu icons on disk", () => {
  const everyState = () => {
    const states: (DiscordState | undefined)[] = [undefined];
    for (const muted of [false, true]) {
      for (const deafened of [false, true]) {
        for (const sharing of [false, true]) {
          for (const members of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
            states.push(stateWith(members, { muted, deafened, sharing }));
          }
        }
      }
    }
    return states;
  };

  it("has a file for every state", () => {
    const missing = everyState()
      .map((state) => String(menuIcon(state)))
      .filter((icon) => !fs.existsSync(path.join(ICONS_DIRECTORY, icon)));

    expect(missing).toEqual([]);
  });

  it("has no file that no state uses", () => {
    const used = new Set(everyState().map((state) => path.basename(String(menuIcon(state)))));
    const onDisk = fs.readdirSync(path.join(ICONS_DIRECTORY, "menu-icons"));

    expect(onDisk.filter((file) => !used.has(file))).toEqual([]);
  });
});
