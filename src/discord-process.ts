import { execFile, spawn } from "child_process";
import waitPort from "wait-port";
import { DEBUG_PORT } from "./constants";

const DISCORD_BINARY = "/Applications/Discord.app/Contents/MacOS/Discord";
const QUIT_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 200;
const PORT_TIMEOUT_MS = 8000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Exact match on the process name, the helper processes are named differently
const findDiscordPid = () =>
  new Promise<number | undefined>((resolve) => {
    execFile("pgrep", ["-x", "Discord"], (error, stdout) => {
      const pid = Number(stdout.split("\n")[0]);
      resolve(error || !pid ? undefined : pid);
    });
  });

export const isDiscordRunning = async () => (await findDiscordPid()) !== undefined;

export const stopDiscord = async () => {
  const pid = await findDiscordPid();
  if (!pid) {
    return true;
  }
  process.kill(pid, "SIGTERM");
  const deadline = Date.now() + QUIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!(await isDiscordRunning())) {
      return true;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return false;
};

export const launchDiscordWithDebugger = async () => {
  const child = spawn(DISCORD_BINARY, [`--remote-debugging-port=${DEBUG_PORT}`, "--remote-allow-origins=*"], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
  });
  child.unref();
  const { open } = await waitPort({ host: "127.0.0.1", port: DEBUG_PORT, timeout: PORT_TIMEOUT_MS }).catch(() => ({
    open: false,
  }));
  return open;
};
