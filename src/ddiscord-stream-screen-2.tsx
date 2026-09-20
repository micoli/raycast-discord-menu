import { runDiscordCommand } from "./util";

export default async function Command() {
  await runDiscordCommand({ type: "startScreenShare", screenIndex: 2 });
}
