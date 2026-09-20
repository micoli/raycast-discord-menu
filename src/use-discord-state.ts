import { useCallback, useEffect, useState } from "react";
import type { DiscordState } from "./injected/messages";
import { getDiscordState } from "./util";

type Snapshot = { data?: DiscordState; error?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const takeSnapshot = (): Promise<Snapshot> =>
  getDiscordState().then(
    (data) => ({ data }),
    (error) => ({ error: error instanceof Error ? error.message : String(error) }),
  );

export function useDiscordState(intervalMs: number) {
  const [snapshot, setSnapshot] = useState<Snapshot>({});

  const refresh = useCallback(async () => {
    const next = await takeSnapshot();
    // Keeping the same reference lets React skip the render when nothing changed
    setSnapshot((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
  }, []);

  useEffect(() => {
    let stopped = false;
    const loop = async () => {
      // React strict mode mounts, unmounts and remounts effects: yielding first lets the discarded run stop before fetching
      await Promise.resolve();
      while (!stopped) {
        await refresh();
        await sleep(intervalMs);
      }
    };
    loop();
    return () => {
      stopped = true;
    };
  }, [refresh, intervalMs]);

  return { ...snapshot, isLoading: !snapshot.data && !snapshot.error, refresh };
}
