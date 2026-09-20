import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { environment } from "@raycast/api";
import { DEBUG_PORT } from "./constants";

const RAYCAST_NODE_RUNTIME = path.join(os.homedir(), "Library/Application Support/com.raycast.macos/NodeJS/runtime");
const MAX_LOG_SIZE_BYTES = 200 * 1024;

type WatcherRecord = { pid: number; version: string };

const pidFile = () => path.join(environment.supportPath, "watcher.json");
const logFile = () => path.join(environment.supportPath, "watcher.log");
const scriptFile = () => path.join(environment.assetsPath, "discord-watcher.js");

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const readRecord = (): WatcherRecord | undefined => {
  try {
    return JSON.parse(fs.readFileSync(pidFile(), "utf8"));
  } catch {
    return undefined;
  }
};

// Raycast bundles its own node, the newest version folder wins
const findNodeBinary = () => {
  if (path.basename(process.execPath) === "node") {
    return process.execPath;
  }
  try {
    const versions = fs
      .readdirSync(RAYCAST_NODE_RUNTIME)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return versions
      .map((version) => path.join(RAYCAST_NODE_RUNTIME, version, "bin/node"))
      .reverse()
      .find(fs.existsSync);
  } catch {
    return undefined;
  }
};

const openLogFile = () => {
  fs.mkdirSync(environment.supportPath, { recursive: true });
  const isTooBig = fs.existsSync(logFile()) && fs.statSync(logFile()).size > MAX_LOG_SIZE_BYTES;
  return fs.openSync(logFile(), isTooBig ? "w" : "a");
};

export const ensureWatcherRunning = (refreshUrl: string) => {
  const script = scriptFile();
  const nodeBinary = findNodeBinary();
  if (!nodeBinary || !fs.existsSync(script)) {
    return;
  }

  const version = String(fs.statSync(script).mtimeMs);
  const running = readRecord();
  if (running && isAlive(running.pid)) {
    if (running.version === version) {
      return;
    }
    process.kill(running.pid);
  }

  const output = openLogFile();
  const child = spawn(nodeBinary, [script, refreshUrl, pidFile(), String(DEBUG_PORT)], {
    detached: true,
    stdio: ["ignore", output, output],
  });
  child.unref();
  fs.closeSync(output);
  if (child.pid) {
    fs.writeFileSync(pidFile(), JSON.stringify({ pid: child.pid, version } satisfies WatcherRecord));
  }
};
