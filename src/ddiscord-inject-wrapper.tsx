import { debugWebsocketRequest } from "./util";
import fs from "fs";
import { closeMainWindow } from "@raycast/api";

export default async function Command() {
  await debugWebsocketRequest(5656, fs.readFileSync(__dirname + "/assets/discordExecutor.js").toString());
  await closeMainWindow();
}
