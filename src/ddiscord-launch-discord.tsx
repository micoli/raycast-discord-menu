import child_process from "child_process";

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
}
