import { useCallback, useEffect, useState } from "react";
import { Cache } from "@raycast/api";
import type { DiscordState } from "./injected/messages";
import { getDiscordState } from "./util";

type Snapshot = { data?: DiscordState; error?: string };

const CACHE_KEY = "discord-state";
const cache = new Cache();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readCachedSnapshot = (): Snapshot => {
  const cached = cache.get(CACHE_KEY);
  return cached ? (JSON.parse(cached) as Snapshot) : {};
};

const takeSnapshot = (): Promise<Snapshot> =>
  getDiscordState().then(
    (data) => ({ data }),
    (error) => ({ error: error instanceof Error ? error.message : String(error) }),
  );

// Without intervalMs the state is read once: a polling loop keeps the command alive and closes the menu bar menu when it is opened
export function useDiscordState(intervalMs?: number) {
  const [snapshot, setSnapshot] = useState<Snapshot>(readCachedSnapshot);
  const [hasFetched, setHasFetched] = useState(false);

  const refresh = useCallback(async () => {
    const next = await takeSnapshot();
    cache.set(CACHE_KEY, JSON.stringify(next));
    // Keeping the same reference lets React skip the render when nothing changed
    setSnapshot((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    setHasFetched(true);
  }, []);

  useEffect(() => {
    let stopped = false;
    const run = async () => {
      // React strict mode mounts, unmounts and remounts effects: yielding first lets the discarded run stop before fetching
      await Promise.resolve();
      while (!stopped) {
        await refresh();
        if (intervalMs === undefined) {
          return;
        }
        await sleep(intervalMs);
      }
    };
    run();
    return () => {
      stopped = true;
    };
  }, [refresh, intervalMs]);

  // Stays loading until the first real fetch, the cached snapshot is only shown meanwhile
  return { ...snapshot, isLoading: !hasFetched, refresh };
}
