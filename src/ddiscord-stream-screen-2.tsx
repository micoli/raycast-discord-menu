import { debugWebsocketRequest } from "./util";
import { closeMainWindow } from "@raycast/api";

export default async function Command() {
  await debugWebsocketRequest(5656, 'document.discordExecutor.run({"screenIndex": 2,"type":"startScreenShare"});');
  await closeMainWindow();
}
