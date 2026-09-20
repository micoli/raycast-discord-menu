// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordExecutor } from "../../src/injected/discordExecutor";
import type { DiscordMessage } from "../../src/injected/messages";
import { FakeDiscord, type FakeDiscordOptions } from "../fixtures/fake-discord";

let discord: FakeDiscord;
let executor: DiscordExecutor;

const setUp = (options?: FakeDiscordOptions) => {
  discord?.dispose();
  discord = new FakeDiscord(options);
  executor = new DiscordExecutor();
};

const run = (message: DiscordMessage) => executor.run(message);

beforeEach(() => setUp({ screens: 2 }));

afterEach(() => {
  executor.dispose();
  discord.dispose();
  vi.useRealTimers();
});

describe("microphone", () => {
  it("toggles", () => {
    run({ type: "toggleMicrophone" });
    expect(discord.muted).toBe(true);

    run({ type: "toggleMicrophone" });
    expect(discord.muted).toBe(false);
  });

  it("mutes only when it is not muted", () => {
    run({ type: "muteMicrophone" });
    run({ type: "muteMicrophone" });

    expect(discord.muted).toBe(true);
  });

  it("unmutes only when it is muted", () => {
    run({ type: "unmuteMicrophone" });
    expect(discord.muted).toBe(false);

    setUp({ muted: true });
    run({ type: "unmuteMicrophone" });
    run({ type: "unmuteMicrophone" });

    expect(discord.muted).toBe(false);
  });

  it("fails when discord has no such button", () => {
    document.body.innerHTML = "";

    expect(() => run({ type: "toggleMicrophone" })).toThrow("Button not found: Rendre muet");
  });
});

describe("speaker", () => {
  it("toggles", () => {
    run({ type: "toggleSpeaker" });
    expect(discord.deafened).toBe(true);

    run({ type: "toggleSpeaker" });
    expect(discord.deafened).toBe(false);
  });

  it("deafens only when it is not deafened", () => {
    run({ type: "deafen" });
    run({ type: "deafen" });

    expect(discord.deafened).toBe(true);
    expect(discord.muted).toBe(true);
  });

  it("undeafens only when it is deafened", () => {
    run({ type: "undeafen" });
    expect(discord.deafened).toBe(false);

    setUp({ deafened: true, muted: true });
    run({ type: "undeafen" });
    run({ type: "undeafen" });

    expect(discord.deafened).toBe(false);
    expect(discord.muted).toBe(false);
  });
});

describe("screen share", () => {
  it("shares the first screen by default", async () => {
    await run({ type: "startScreenShare" });

    expect(discord.sharing).toBe(true);
    expect(discord.sharedScreen).toBe(1);
    expect(discord.dialog()).toBeNull();
  });

  it("shares the requested screen", async () => {
    await run({ type: "startScreenShare", screenIndex: 2 });

    expect(discord.sharedScreen).toBe(2);
  });

  it("does nothing when it already shares", async () => {
    setUp({ sharing: true });

    await run({ type: "startScreenShare", screenIndex: 2 });

    expect(discord.sharedScreen).toBeUndefined();
    expect(discord.dialog()).toBeNull();
  });

  it("fails outside a voice channel", async () => {
    setUp({ connected: false });

    await expect(async () => run({ type: "startScreenShare" })).rejects.toThrow("Share button not found");
  });

  it("closes the picker and explains when the screen does not exist", async () => {
    vi.useFakeTimers();

    const failure = expect(run({ type: "startScreenShare", screenIndex: 3 })).rejects.toThrow(
      "Screen 3 not available in the picker",
    );
    await vi.advanceTimersByTimeAsync(6000);
    await failure;

    expect(discord.escapePressed).toBe(1);
    expect(discord.dialog()).toBeNull();
    expect(discord.sharing).toBe(false);
  });

  it("stops", async () => {
    setUp({ sharing: true });

    await run({ type: "stopScreenShare" });

    expect(discord.sharing).toBe(false);
  });

  it("does nothing to stop when it does not share", async () => {
    await expect(run({ type: "stopScreenShare" })).resolves.toBeUndefined();
  });
});

describe("state", () => {
  it("is read on demand", () => {
    setUp({ muted: true, sharing: true });

    expect(run({ type: "getState" })).toMatchObject({ connected: true, muted: true, sharing: true });
  });

  it("is watched until the executor is disposed", () => {
    expect(executor.watching).toBe(false);

    run({ type: "watchState" });
    expect(executor.watching).toBe(true);

    executor.dispose();
    expect(executor.watching).toBe(false);
  });

  it("can be watched again without stacking the observers", () => {
    const observe = vi.spyOn(MutationObserver.prototype, "disconnect");

    run({ type: "watchState" });
    run({ type: "watchState" });

    expect(observe).toHaveBeenCalledTimes(1);
  });
});

it("rejects a message it does not know", () => {
  expect(() => run({ type: "unknown" } as unknown as DiscordMessage)).toThrow("Unknown message");
});
