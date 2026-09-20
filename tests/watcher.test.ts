import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeCdpServer } from "./fixtures/fake-cdp-server";

// The built watcher, the same file the extension starts
const WATCHER = path.resolve("assets/discord-watcher.js");
const MENU_URL = "raycast://extensions/owner/extension/ddiscord-menu?launchType=background";
const PORT = 25000 + (process.pid % 20000);
const BINDING = "notifyRaycast";

let directory: string;
let server: FakeCdpServer;
let watcher: ChildProcess | undefined;
let output = "";

const openLog = () => path.join(directory, "open.log");

// What the fake open command recorded
const openCalls = () => (fs.existsSync(openLog()) ? fs.readFileSync(openLog(), "utf8").trim().split("\n") : []);

const waitUntil = async (condition: () => boolean, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Condition not met in ${timeoutMs} ms, watcher output:\n${output}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const startWatcher = (ownerPid?: number) => {
  const pidFile = path.join(directory, "watcher.json");
  watcher = spawn(process.execPath, [WATCHER, MENU_URL, pidFile, String(PORT)], {
    env: {
      ...process.env,
      PATH: `${path.join(directory, "bin")}${path.delimiter}${process.env.PATH}`,
      OPEN_LOG: openLog(),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  watcher.stdout?.on("data", (chunk) => (output += chunk));
  watcher.stderr?.on("data", (chunk) => (output += chunk));
  fs.writeFileSync(pidFile, JSON.stringify({ pid: ownerPid ?? watcher.pid }));
  return watcher;
};

beforeEach(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "discord-watcher-"));
  fs.mkdirSync(path.join(directory, "bin"));
  // Replaces the macOS open command, which would open a real deeplink
  fs.writeFileSync(path.join(directory, "bin", "open"), '#!/bin/sh\necho "$@" >> "$OPEN_LOG"\n', { mode: 0o755 });
  output = "";
  server = new FakeCdpServer(PORT);
  await server.start();
});

afterEach(async () => {
  watcher?.kill("SIGKILL");
  watcher = undefined;
  await server.stop();
  fs.rmSync(directory, { recursive: true, force: true });
});

describe("the watcher process", () => {
  it("listens to the binding of the injected script", async () => {
    startWatcher();

    await waitUntil(() => server.bindings.includes(BINDING));
  });

  it("opens the menu deeplink in the background when the injected script reports a change", async () => {
    startWatcher();
    await waitUntil(() => server.bindings.includes(BINDING));

    server.callBinding(BINDING, "stateChanged");

    await waitUntil(() => openCalls().length === 1);
    expect(openCalls()).toEqual([`-g ${MENU_URL}`]);
  });

  it("opens the deeplink once for a burst of reports, then again later", async () => {
    startWatcher();
    await waitUntil(() => server.bindings.includes(BINDING));

    for (let report = 0; report < 5; report++) {
      server.callBinding(BINDING);
    }
    await waitUntil(() => openCalls().length === 1);
    await pause(700);
    expect(openCalls()).toHaveLength(1);

    server.callBinding(BINDING);
    await waitUntil(() => openCalls().length === 2);
  });

  it("ignores the other bindings", async () => {
    startWatcher();
    await waitUntil(() => server.bindings.includes(BINDING));

    server.callBinding("somethingElse");
    await pause(700);

    expect(openCalls()).toEqual([]);
  });

  it("connects again when discord restarts", { timeout: 20_000 }, async () => {
    startWatcher();
    await waitUntil(() => server.bindings.includes(BINDING));

    await server.stop();
    server = new FakeCdpServer(PORT);
    await server.start();

    await waitUntil(() => server.bindings.includes(BINDING), 15_000);
    server.callBinding(BINDING);
    await waitUntil(() => openCalls().length === 1);
  });

  it("stops when a newer watcher owns the pid file", async () => {
    const running = startWatcher(process.pid);

    const exitCode = await new Promise<number | null>((resolve) => running.on("exit", resolve));

    expect(exitCode).toBe(0);
    expect(output).toContain("exit");
  });
});
