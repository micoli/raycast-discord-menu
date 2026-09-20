// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  dismissDialog,
  findActionButton,
  findScreenPickerTab,
  findScreenPickerTile,
  findShareButton,
  readConnectedVoiceChannel,
  readDiscordState,
} from "../../src/injected/discord-dom";
import { FakeDiscord, type FakeDiscordOptions } from "../fixtures/fake-discord";

let discord: FakeDiscord;

const mount = (options?: FakeDiscordOptions) => {
  discord = new FakeDiscord(options);
  return discord;
};

afterEach(() => discord?.dispose());

describe("findActionButton", () => {
  it("finds a button through the tooltip its aria-describedby points to", () => {
    mount({ tooltips: ["Allumer la caméra", "Commencer une activité", "Partage ton écran"] });

    const buttons = Array.from(document.querySelectorAll('[class*="actionButtons_"] > button'));

    expect(findShareButton()).toBe(buttons[2]);
  });

  it("falls back on the position when no tooltip matches the label", () => {
    mount({ tooltips: ["Turn on camera", "Share your screen", "Start an activity"] });

    const buttons = Array.from(document.querySelectorAll('[class*="actionButtons_"] > button'));

    expect(findShareButton()).toBe(buttons[1]);
    expect(findActionButton("Unknown", 0)).toBe(buttons[0]);
  });

  it("finds nothing outside a voice channel", () => {
    mount({ connected: false });

    expect(findShareButton()).toBeNull();
  });
});

describe("readDiscordState", () => {
  it("reads an idle state", () => {
    mount();

    expect(readDiscordState()).toEqual({
      connected: true,
      muted: false,
      deafened: false,
      sharing: false,
      voice: { channel: "General", members: [{ name: "micoli" }] },
    });
  });

  it.each([
    ["muted", { muted: true }],
    ["deafened", { deafened: true }],
    ["sharing", { sharing: true }],
  ])("reads the %s flag", (flag, options) => {
    mount(options);

    expect(readDiscordState()).toMatchObject({ connected: true, [flag]: true });
  });

  it("reads a state outside a voice channel", () => {
    mount({ connected: false, muted: true });

    expect(readDiscordState()).toEqual({
      connected: false,
      muted: true,
      deafened: false,
      sharing: false,
      voice: null,
    });
  });
});

describe("readConnectedVoiceChannel", () => {
  it("is null outside a voice channel", () => {
    mount({ connected: false });

    expect(readConnectedVoiceChannel()).toBeNull();
  });

  it("drops the type and the call duration from the channel name", () => {
    mount({
      channels: [
        {
          name: "test2",
          label: "test2 (salon vocal), micoli, durée de l'appel 0 minute, 58 secondes",
          members: ["micoli"],
        },
      ],
    });

    expect(readConnectedVoiceChannel()?.channel).toBe("test2");
  });

  it("does not put the state of a member in its name", () => {
    mount({ channels: [{ name: "General", members: [{ name: "micoli", status: "Muet" }] }] });

    expect(readConnectedVoiceChannel()?.members).toEqual([{ name: "micoli" }]);
  });

  it("keeps a comma inside the name of a member", () => {
    mount({ channels: [{ name: "General", members: [{ name: "Doe, John", status: "Muet" }] }] });

    expect(readConnectedVoiceChannel()?.members).toEqual([{ name: "Doe, John" }]);
  });

  it("reads the avatar of a member", () => {
    mount({
      channels: [{ name: "General", members: [{ name: "micoli", avatarUrl: "https://cdn.test/a.webp?size=48" }] }],
    });

    expect(readConnectedVoiceChannel()?.members[0].avatarUrl).toBe("https://cdn.test/a.webp?size=48");
  });

  it("keeps a member once", () => {
    mount({ channels: [{ name: "General", members: ["micoli", "micoli", "alice"] }] });

    expect(readConnectedVoiceChannel()?.members.map((member) => member.name)).toEqual(["micoli", "alice"]);
  });

  it("picks the channel the current user is in", () => {
    mount({
      userName: "micoli",
      channels: [
        { name: "Lobby", members: ["bob"] },
        { name: "Work", members: ["alice", "micoli"] },
      ],
    });

    expect(readConnectedVoiceChannel()).toMatchObject({ channel: "Work" });
  });

  it("falls back on the only channel with members when the user is not found", () => {
    mount({
      userName: "someone",
      channels: [
        { name: "Empty", members: [] },
        { name: "Work", members: ["alice"] },
      ],
    });

    expect(readConnectedVoiceChannel()).toMatchObject({ channel: "Work" });
  });

  it("gives up when the user is not found and several channels have members", () => {
    mount({
      userName: "someone",
      channels: [
        { name: "Lobby", members: ["bob"] },
        { name: "Work", members: ["alice"] },
      ],
    });

    expect(readConnectedVoiceChannel()).toBeNull();
  });
});

describe("screen picker", () => {
  const renderPicker = () => {
    document.body.innerHTML = `<div role="dialog">
      <div role="tab">Applications</div><div role="tab">Écran entier</div><div role="tab">Appareils</div>
      <div class="source__2f580">first</div><div class="source__2f580">second</div></div>`;
  };

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("finds the screen tab, the second one", () => {
    renderPicker();

    expect(findScreenPickerTab()?.textContent).toBe("Écran entier");
  });

  it("finds the tile of a screen from its 1 based index", () => {
    renderPicker();

    expect(findScreenPickerTile(2)?.textContent).toBe("second");
    expect(findScreenPickerTile(3)).toBeNull();
  });

  it("finds nothing while the picker is closed", () => {
    expect(findScreenPickerTab()).toBeNull();
    expect(findScreenPickerTile(1)).toBeNull();
  });
});

describe("dismissDialog", () => {
  it("presses escape", () => {
    const keys: string[] = [];
    const listener = (event: KeyboardEvent) => keys.push(`${event.type}:${event.key}:${event.cancelable}`);
    document.addEventListener("keydown", listener);
    document.addEventListener("keyup", listener);

    dismissDialog();

    document.removeEventListener("keydown", listener);
    document.removeEventListener("keyup", listener);
    expect(keys).toEqual(["keydown:Escape:true", "keyup:Escape:true"]);
  });
});
