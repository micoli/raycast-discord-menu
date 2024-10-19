import { MenuBarExtra } from "@raycast/api";
import { debugWebsocketRequest, inject } from "./util";
import fs from "fs";
import process from "process";

export default function Command() {
  // console.log(process.cwd())
  // const filenames = fs.readdirSync(__dirname+'/assets');
  //
  // console.log("\nCurrent directory filenames:");
  // filenames.forEach(file => {
  //   console.log(file);
  // });
  return (
    <MenuBarExtra icon="https://github.githubassets.com/favicons/favicon.png" tooltip="Your Pull Requests">
      <MenuBarExtra.Item
        title="Stream screen 1"
        onAction={async () => {
          console.log(await debugWebsocketRequest(5656,'document.discordExecutor.run({"screenIndex": 1,"type":"startScreenShare"});'));
          console.log("seen pull request clicked");
        }}
      />
      <MenuBarExtra.Item
        title="Stream screen 2"
        onAction={async () => {
          console.log(await debugWebsocketRequest(5656,'document.discordExecutor.run({"screenIndex": 1,"type":"startScreenShare"});'));
          console.log("seen 2 pull request clicked");
        }}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="Inject discord wrapper"
        onAction={async () => {
          console.log(await debugWebsocketRequest(5656,fs.readFileSync(__dirname+'/assets/discordExecutor.js').toString()));
          console.log("seen pull request clicked");
        }}
      />
    </MenuBarExtra>
  );
}
