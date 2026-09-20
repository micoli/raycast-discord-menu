import { DiscordExecutor } from "./discordExecutor";

declare global {
  interface Document {
    discordExecutor: DiscordExecutor;
  }
}

document.discordExecutor = new DiscordExecutor();
