// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startStateWatcher } from "../../src/injected/state-watcher";
import { FakeDiscord } from "../fixtures/fake-discord";

let discord: FakeDiscord;
let stop: (() => void) | undefined;
let notify: ReturnType<typeof vi.fn>;

const click = (label: string) => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)?.click();
const clickMute = () => click("Rendre muet");
const clickDeafen = () => click("Mettre en sourdine");

// The mutation observer callbacks run as microtasks, the checks are throttled by timers
const elapse = (ms: number) => vi.advanceTimersByTimeAsync(ms);

beforeEach(() => {
  vi.useFakeTimers();
  discord = new FakeDiscord();
  notify = vi.fn();
  window.notifyRaycast = notify;
  stop = startStateWatcher();
});

afterEach(() => {
  stop?.();
  delete window.notifyRaycast;
  discord.dispose();
  vi.useRealTimers();
});

describe("startStateWatcher", () => {
  it("notifies once when the state changes", async () => {
    clickMute();
    await elapse(300);

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith("stateChanged");
  });

  it("does not notify for changes that do not touch the state", async () => {
    document.body.insertAdjacentHTML("beforeend", "<div>chat message</div>");
    await elapse(2000);

    expect(notify).not.toHaveBeenCalled();
  });

  it("does not notify when the state is back to its value before the check", async () => {
    clickMute();
    clickMute();
    await elapse(2000);

    expect(notify).not.toHaveBeenCalled();
  });

  it("waits a second between two notifications", async () => {
    clickMute();
    await elapse(300);
    expect(notify).toHaveBeenCalledTimes(1);

    clickDeafen();
    await elapse(900);
    expect(notify).toHaveBeenCalledTimes(1);

    await elapse(100);
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("stops watching", async () => {
    stop?.();

    clickMute();
    await elapse(2000);

    expect(notify).not.toHaveBeenCalled();
  });

  it("does nothing when nobody listens", async () => {
    delete window.notifyRaycast;

    clickMute();

    await expect(elapse(2000)).resolves.not.toThrow();
  });
});
