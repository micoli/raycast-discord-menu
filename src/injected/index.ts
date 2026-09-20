import { DiscordExecutor } from "./discordExecutor";

declare global {
  interface Document {
    discordExecutor: DiscordExecutor;
  }
}

// A previous injection may still be watching the DOM
document.discordExecutor?.dispose?.();
document.discordExecutor = new DiscordExecutor();
