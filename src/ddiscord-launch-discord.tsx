import { closeMainWindow, showHUD } from "@raycast/api";
import { isDiscordRunning, launchDiscordWithDebugger, stopDiscord } from "./discord-process";
import { isDebuggerReachable } from "./util";

export default async function Command() {
  if (await isDebuggerReachable()) {
    return showHUD("Discord is already running with the debugger");
  }
  if ((await isDiscordRunning()) && !(await stopDiscord())) {
    return showHUD("Discord did not quit, cannot relaunch it with the debugger");
  }
  if (!(await launchDiscordWithDebugger())) {
    return showHUD("Discord debugging port did not open in time");
  }
  await closeMainWindow();
}
