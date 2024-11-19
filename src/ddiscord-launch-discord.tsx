import child_process from "child_process";
import { closeMainWindow, launchCommand, LaunchType } from "@raycast/api";
import waitPort from "wait-port";

export default async function Command() {
  const child = child_process.spawn(
    "/Applications/Discord.app/Contents/MacOS/Discord",
    ["--remote-debugging-port=5656", '--remote-allow-origins="*"'],
    {
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    },
  );
  child.unref();

  try {
    const { open, ipVersion } = await waitPort({
      host: "127.0.0.1",
      port: 5656,
      timeout: 5000,
    });
    if (!open) {
      console.log("The port did not open before the timeout...");
      return;
    }
    console.log(`The port is now open on IPv${ipVersion}!`);
    await launchCommand({ name: "ddiscord-inject-wrapper", type: LaunchType.Background });
    await closeMainWindow();
  } catch (err) {
    console.error(`An unknown error occured while waiting for the port: ${err}`);
  }
}
