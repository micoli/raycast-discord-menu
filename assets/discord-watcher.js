"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/watcher/index.ts
var import_node_child_process = require("node:child_process");
var import_node_fs = __toESM(require("node:fs"));
var [refreshUrl, pidFile, portArgument] = process.argv.slice(2);
var port = Number(portArgument);
var BINDING_NAME = "notifyRaycast";
var OWNER_CHECK_DELAY_MS = 500;
var RETRY_DELAY_MS = 5e3;
var MAX_UNREACHABLE_MS = 10 * 60 * 1e3;
var MIN_OPEN_INTERVAL_MS = 500;
var log = (message) => console.log(`${(/* @__PURE__ */ new Date()).toISOString()} ${message}`);
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var isOwner = () => {
  try {
    return JSON.parse(import_node_fs.default.readFileSync(pidFile, "utf8")).pid === process.pid;
  } catch {
    return false;
  }
};
var lastOpenedAt = 0;
var openRefreshUrl = () => {
  if (Date.now() - lastOpenedAt < MIN_OPEN_INTERVAL_MS) {
    return;
  }
  lastOpenedAt = Date.now();
  (0, import_node_child_process.execFile)("open", ["-g", refreshUrl], (error) => error && log(`open failed: ${error.message}`));
};
var findDiscordSocketUrl = async () => {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await response.json();
  return targets.find((target) => target.type === "page" && target.url.includes("discord.com"))?.webSocketDebuggerUrl;
};
var listen = (socketUrl) => new Promise((resolve) => {
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
var main = async () => {
  log(`started pid=${process.pid}`);
  await sleep(OWNER_CHECK_DELAY_MS);
  let unreachableSince;
  while (isOwner()) {
    const socketUrl = await findDiscordSocketUrl().catch(() => void 0);
    if (socketUrl) {
      unreachableSince = void 0;
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
