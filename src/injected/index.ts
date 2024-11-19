import { DiscordExecutor } from "./discordExecutor";

declare global {
  interface Document {
    discordExecutor: DiscordExecutor;
  }
}

(() => {
  const dispatch = (message: string, log = true) => {
    try {
      if (log) {
        console.log("dispatch", JSON.stringify(message));
      }
    } catch (error) {
      console.log("dispatch error", error);
    }
  };
  document.discordExecutor = new DiscordExecutor(dispatch);
})();
