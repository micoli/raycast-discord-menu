// Standalone process (run with the node bundled in Raycast): listens to discord through the devtools protocol
// and opens a raycast deeplink in the background each time the injected script reports a state change.
// Opening the url from the discord page instead would bring Raycast to the front.
import { execFile } from "node:child_process";
import fs from "node:fs";

const [refreshUrl, pidFile, portArgument] = process.argv.slice(2);
const port = Number(portArgument);

const BINDING_NAME = "notifyRaycast";
const OWNER_CHECK_DELAY_MS = 500;
const RETRY_DELAY_MS = 5000;
const MAX_UNREACHABLE_MS = 10 * 60 * 1000;
const MIN_OPEN_INTERVAL_MS = 500;

const log = (message: string) => console.log(`${new Date().toISOString()} ${message}`);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The pid file names the watcher that must stay alive, a newer one replaces this one
const isOwner = () => {
  try {
    return JSON.parse(fs.readFileSync(pidFile, "utf8")).pid === process.pid;
  } catch {
    return false;
  }
};

let lastOpenedAt = 0;
const openRefreshUrl = () => {
  if (Date.now() - lastOpenedAt < MIN_OPEN_INTERVAL_MS) {
    return;
  }
  lastOpenedAt = Date.now();
  execFile("open", ["-g", refreshUrl], (error) => error && log(`open failed: ${error.message}`));
};

const findDiscordSocketUrl = async () => {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = (await response.json()) as { type: string; url: string; webSocketDebuggerUrl: string }[];
  return targets.find((target) => target.type === "page" && target.url.includes("discord.com"))?.webSocketDebuggerUrl;
};

const listen = (socketUrl: string) =>
  new Promise<void>((resolve) => {
    const socket = new WebSocket(socketUrl);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ id: 1, method: "Runtime.addBinding", params: { name: BINDING_NAME } }));
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.method === "Runtime.bindingCalled" && message.params?.name === BINDING_NAME) {
        openRefreshUrl();
      }
    });
    socket.addEventListener("close", () => resolve());
    socket.addEventListener("error", () => resolve());
  });

const main = async () => {
  log(`started pid=${process.pid}`);
  await sleep(OWNER_CHECK_DELAY_MS);

  let unreachableSince: number | undefined;
  while (isOwner()) {
    const socketUrl = await findDiscordSocketUrl().catch(() => undefined);
    if (socketUrl) {
      unreachableSince = undefined;
      log("connected");
      await listen(socketUrl);
      log("disconnected");
    } else {
      unreachableSince ??= Date.now();
      if (Date.now() - unreachableSince > MAX_UNREACHABLE_MS) {
        log("discord unreachable for too long");
        break;
      }
    }
    await sleep(RETRY_DELAY_MS);
  }
  log("exit");
};

main();
