import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeMainWindow, environment, showHUD } from "@raycast/api";
import { getDiscordState, isDebuggerReachable, runDiscordCommand, sendDiscordMessage } from "../src/util";
import { ensureWatcherRunning } from "../src/watcher-process";
import { FakeCdpServer } from "./fixtures/fake-cdp-server";

const { port } = vi.hoisted(() => ({ port: 20000 + (process.pid % 20000) }));

vi.mock("../src/constants", () => ({ DEBUG_PORT: port }));
vi.mock("../src/watcher-process", () => ({ ensureWatcherRunning: vi.fn() }));

const BUNDLE = "/* injected bundle */";
const STATE = { connected: true, muted: false, deafened: false, sharing: false, voice: null };

let assetsPath: string;
let server: FakeCdpServer;
// What the page knows about the executor injected by the extension
let injected: { bundleVersion: string | null; watching: boolean };
let messages: unknown[];

const bundleVersion = () => String(fs.statSync(path.join(assetsPath, "discordExecutor.js")).mtimeMs);

const startDiscord = async (evaluate?: (expression: string) => unknown) => {
  server = new FakeCdpServer(port, (expression) => {
    if (expression === "document.discordExecutor?.bundleVersion ?? null") {
      return injected.bundleVersion;
    }
    if (expression === "document.discordExecutor?.watching === true") {
      return injected.watching;
    }
    if (expression === BUNDLE) {
      injected = { bundleVersion: null, watching: false };
      return undefined;
    }
    const version = expression.match(/^document\.discordExecutor\.bundleVersion = "([^"]+)";/)?.[1];
    if (version) {
      injected = { bundleVersion: version, watching: true };
      return undefined;
    }
    const message = expression.match(/^document\.discordExecutor\.run\((.*)\)$/)?.[1];
    if (message) {
      messages.push(JSON.parse(message));
      return evaluate ? evaluate(expression) : STATE;
    }
    throw new Error(`Unexpected expression ${expression}`);
  });
  await server.start();
};

beforeEach(() => {
  assetsPath = fs.mkdtempSync(path.join(os.tmpdir(), "discord-assets-"));
  fs.writeFileSync(path.join(assetsPath, "discordExecutor.js"), BUNDLE);
  environment.assetsPath = assetsPath;
  injected = { bundleVersion: null, watching: false };
  messages = [];
});

afterEach(async () => {
  await server?.stop();
  fs.rmSync(assetsPath, { recursive: true, force: true });
  vi.mocked(ensureWatcherRunning).mockReset();
});

describe("sendDiscordMessage", () => {
  it("returns what the injected script answers", async () => {
    await startDiscord();

    await expect(getDiscordState()).resolves.toEqual(STATE);
    expect(messages).toEqual([{ type: "getState" }]);
  });

  it("injects the script and starts watching when the page has none", async () => {
    await startDiscord();

    await sendDiscordMessage({ type: "toggleSpeaker" });

    expect(server.evaluated).toContain(BUNDLE);
    expect(injected).toEqual({ bundleVersion: bundleVersion(), watching: true });
  });

  it("does not inject again while the script is up to date", async () => {
    await startDiscord();
    await sendDiscordMessage({ type: "toggleSpeaker" });
    server.evaluated.length = 0;

    await sendDiscordMessage({ type: "toggleSpeaker" });

    expect(server.evaluated).not.toContain(BUNDLE);
  });

  it("injects again when the bundle changed", async () => {
    await startDiscord();
    await sendDiscordMessage({ type: "toggleSpeaker" });
    server.evaluated.length = 0;
    const later = new Date(Date.now() + 60_000);
    fs.utimesSync(path.join(assetsPath, "discordExecutor.js"), later, later);

    await sendDiscordMessage({ type: "toggleSpeaker" });

    expect(server.evaluated).toContain(BUNDLE);
    expect(injected.bundleVersion).toBe(bundleVersion());
  });

  it("injects again when the page is not watching", async () => {
    await startDiscord();
    await sendDiscordMessage({ type: "toggleSpeaker" });
    injected.watching = false;
    server.evaluated.length = 0;

    await sendDiscordMessage({ type: "toggleSpeaker" });

    expect(server.evaluated).toContain(BUNDLE);
  });

  it("keeps the watcher process running for the menu deeplink, in the background", async () => {
    await startDiscord();

    await sendDiscordMessage({ type: "toggleSpeaker" });

    expect(ensureWatcherRunning).toHaveBeenCalledWith(
      "raycast://extensions/owner/extension/ddiscord-menu?launchType=background",
    );
  });

  it("still answers when the watcher process cannot start", async () => {
    await startDiscord();
    vi.mocked(ensureWatcherRunning).mockImplementation(() => {
      throw new Error("no node");
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(getDiscordState()).resolves.toEqual(STATE);
  });

  it("fails with the error the page raised", async () => {
    await startDiscord(() => {
      throw new Error("Button not found: Rendre muet");
    });

    await expect(sendDiscordMessage({ type: "toggleMicrophone" })).rejects.toThrow("Button not found: Rendre muet");
  });

  it("fails when discord cannot be reached", async () => {
    await expect(getDiscordState()).rejects.toThrow("Discord not reachable");
  });
});

describe("isDebuggerReachable", () => {
  it("is true when discord listens", async () => {
    await startDiscord();

    await expect(isDebuggerReachable()).resolves.toBe(true);
  });

  it("is false when nothing listens", async () => {
    await expect(isDebuggerReachable()).resolves.toBe(false);
  });
});

describe("runDiscordCommand", () => {
  it("closes the main window once done", async () => {
    await startDiscord();

    await runDiscordCommand({ type: "muteMicrophone" });

    expect(closeMainWindow).toHaveBeenCalledTimes(1);
    expect(showHUD).not.toHaveBeenCalled();
  });

  it("tells what went wrong instead of closing the window", async () => {
    await runDiscordCommand({ type: "muteMicrophone" });

    expect(showHUD).toHaveBeenCalledWith(expect.stringContaining("Discord: Discord not reachable"));
    expect(closeMainWindow).not.toHaveBeenCalled();
  });
});
