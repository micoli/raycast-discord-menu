import { execFile, spawn } from "child_process";
import waitPort from "wait-port";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { isDiscordRunning, launchDiscordWithDebugger, stopDiscord } from "../src/discord-process";

vi.mock("child_process", () => ({ execFile: vi.fn(), spawn: vi.fn() }));
vi.mock("wait-port", () => ({ default: vi.fn() }));

// The pids pgrep answers one after the other, undefined meaning no process, the last one repeating
const mockPgrep = (...answers: (number | undefined)[]) => {
  vi.mocked(execFile).mockImplementation(((
    _command: string,
    _args: string[],
    callback: (...args: unknown[]) => void,
  ) => {
    const pid = answers.length > 1 ? answers.shift() : answers[0];
    callback(pid ? null : new Error("no process matched"), pid ? `${pid}\n` : "");
  }) as unknown as typeof execFile);
};

let kill: MockInstance<typeof process.kill>;

beforeEach(() => {
  // Never send a signal for real
  kill = vi.spyOn(process, "kill").mockImplementation(() => true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isDiscordRunning", () => {
  it("looks for the exact name of the discord process", async () => {
    mockPgrep(4242);

    await isDiscordRunning();

    expect(execFile).toHaveBeenCalledWith("pgrep", ["-x", "Discord"], expect.any(Function));
  });

  it("is true when a process matches", async () => {
    mockPgrep(4242);

    await expect(isDiscordRunning()).resolves.toBe(true);
  });

  it("is false when no process matches", async () => {
    mockPgrep(undefined);

    await expect(isDiscordRunning()).resolves.toBe(false);
  });
});

describe("stopDiscord", () => {
  it("has nothing to do when discord is not running", async () => {
    mockPgrep(undefined);

    await expect(stopDiscord()).resolves.toBe(true);
    expect(kill).not.toHaveBeenCalled();
  });

  it("asks discord to quit and waits until it is gone", async () => {
    mockPgrep(4242, 4242, undefined);

    await expect(stopDiscord()).resolves.toBe(true);
    expect(kill).toHaveBeenCalledWith(4242, "SIGTERM");
  });

  it("gives up when discord does not quit in time", async () => {
    vi.useFakeTimers();
    mockPgrep(4242);

    const stopped = stopDiscord();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(stopped).resolves.toBe(false);
  });
});

describe("launchDiscordWithDebugger", () => {
  const unref = vi.fn();

  beforeEach(() => {
    vi.mocked(spawn).mockReturnValue({ unref } as unknown as ReturnType<typeof spawn>);
  });

  it("starts discord detached with the debugging port open to any origin", async () => {
    vi.mocked(waitPort).mockResolvedValue({ open: true, ipVersion: 4 });

    await launchDiscordWithDebugger();

    expect(spawn).toHaveBeenCalledWith(
      "/Applications/Discord.app/Contents/MacOS/Discord",
      ["--remote-debugging-port=5656", "--remote-allow-origins=*"],
      expect.objectContaining({ detached: true }),
    );
    expect(unref).toHaveBeenCalled();
  });

  it("is true once the port is open", async () => {
    vi.mocked(waitPort).mockResolvedValue({ open: true, ipVersion: 4 });

    await expect(launchDiscordWithDebugger()).resolves.toBe(true);
  });

  it.each([
    ["the port stays closed", () => vi.mocked(waitPort).mockResolvedValue({ open: false, ipVersion: 4 })],
    ["waiting for the port fails", () => vi.mocked(waitPort).mockRejectedValue(new Error("timeout"))],
  ])("is false when %s", async (_description, arrange) => {
    arrange();

    await expect(launchDiscordWithDebugger()).resolves.toBe(false);
  });
});
