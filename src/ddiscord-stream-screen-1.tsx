import { debugWebsocketRequest } from "./util";

export default async function Command() {
  await debugWebsocketRequest(5656, 'document.discordExecutor.run({"screenIndex": 1,"type":"startScreenShare"});');
}
