import { closeMainWindow, showHUD } from "@raycast/api";
import { stopDiscord } from "./discord-process";

export default async function Command() {
  if (!(await stopDiscord())) {
    return showHUD("Discord did not quit");
  }
  await closeMainWindow();
}
