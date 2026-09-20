import { launchCommand, LaunchType } from "@raycast/api";

export default async function Command() {
  await launchCommand({ name: "ddiscord-menu", type: LaunchType.Background });
}
