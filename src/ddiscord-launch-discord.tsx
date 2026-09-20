import child_process from "child_process";
import { closeMainWindow, showHUD } from "@raycast/api";
import waitPort from "wait-port";
import { DEBUG_PORT } from "./util";

export default async function Command() {
  const child = child_process.spawn(
    "/Applications/Discord.app/Contents/MacOS/Discord",
    [`--remote-debugging-port=${DEBUG_PORT}`, "--remote-allow-origins=*"],
    {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    },
  );
  child.unref();

  const { open } = await waitPort({ host: "127.0.0.1", port: DEBUG_PORT, timeout: 5000 }).catch(() => ({
    open: false,
  }));
  if (!open) {
    return showHUD("Discord remote debugging port did not open in time");
  }
  await closeMainWindow();
}
