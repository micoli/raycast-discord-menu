import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import WebSocket from "ws";
import { closeMainWindow, environment, showHUD } from "@raycast/api";
import type { DiscordMessage, DiscordState } from "./injected/messages";

export const DEBUG_PORT = 5656;

type DebugTarget = { type: string; url: string; webSocketDebuggerUrl: string };

type CdpSession = {
  evaluate: (expression: string) => Promise<unknown>;
  close: () => void;
};

const findDiscordPage = async () => {
  const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const targets = (await response.json()) as DebugTarget[];
  return targets.find((target) => target.type === "page" && target.url.includes("discord.com"));
};

const openSession = (webSocketDebuggerUrl: string) =>
  new Promise<CdpSession>((resolve, reject) => {
    const socket = new WebSocket(webSocketDebuggerUrl);
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
    let nextId = 1;

    socket.on("error", reject);
    socket.on("message", (data) => {
      const response = JSON.parse(data.toString());
      const request = pending.get(response.id);
      if (!request) {
        return;
      }
      pending.delete(response.id);
      if (response.error) {
        return request.reject(new Error(response.error.message));
      }
      const { result, exceptionDetails } = response.result;
      if (exceptionDetails) {
        return request.reject(new Error(exceptionDetails.exception?.description ?? exceptionDetails.text));
      }
      request.resolve(result.value);
    });
    socket.on("open", () =>
      resolve({
        close: () => socket.close(),
        evaluate: (expression) =>
          new Promise((resolveEvaluate, rejectEvaluate) => {
            const id = nextId++;
            pending.set(id, { resolve: resolveEvaluate, reject: rejectEvaluate });
            socket.send(
              JSON.stringify({
                id,
                method: "Runtime.evaluate",
                params: { expression, awaitPromise: true, returnByValue: true, userGesture: true },
              }),
            );
          }),
      }),
    );
  });

const readInjectedBundle = () => fs.readFileSync(path.join(environment.assetsPath, "discordExecutor.js"), "utf8");

const refreshMenuUrl = `raycast://extensions/${environment.ownerOrAuthorName}/${environment.extensionName}/ddiscord-refresh-menu?launchType=background`;

// The executor tells raycast to refresh the menu bar (through this url) whenever the discord state changes.
// launchType=background keeps the raycast window from opening
const ensureExecutor = async (session: CdpSession, forceInject: boolean) => {
  const watchedUrl = await session.evaluate("document.discordExecutor?.watchedUrl ?? null");
  if (!forceInject && watchedUrl === refreshMenuUrl) {
    return;
  }
  await session.evaluate(readInjectedBundle());
  const watchMessage: DiscordMessage = { type: "watchState", notifyUrl: refreshMenuUrl };
  await session.evaluate(`document.discordExecutor.run(${JSON.stringify(watchMessage)})`);
};

const withDiscord = async <T>(action: (session: CdpSession) => Promise<T>, { forceInject = false } = {}) => {
  const page = await findDiscordPage().catch(() => undefined);
  if (!page) {
    throw new Error("Discord not reachable, is it launched with remote debugging?");
  }
  const session = await openSession(page.webSocketDebuggerUrl);
  try {
    await ensureExecutor(session, forceInject);
    return await action(session);
  } finally {
    session.close();
  }
};

export const sendDiscordMessage = <T = unknown>(message: DiscordMessage) =>
  withDiscord((session) => session.evaluate(`document.discordExecutor.run(${JSON.stringify(message)})`) as Promise<T>);

export const reinjectExecutor = () => withDiscord(async () => undefined, { forceInject: true });

export const getDiscordState = () => sendDiscordMessage<DiscordState>({ type: "getState" });

export const runDiscordCommand = async (message: DiscordMessage) => {
  try {
    await sendDiscordMessage(message);
  } catch (error) {
    return showHUD(`Discord: ${error instanceof Error ? error.message : String(error)}`);
  }
  await closeMainWindow();
};
