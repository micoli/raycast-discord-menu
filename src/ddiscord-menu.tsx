import { launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";

export default function Command() {
  return (
    <MenuBarExtra icon="../assets/discord_1.png" tooltip="Discord helper">
      <MenuBarExtra.Item
        title="Stream screen 1"
        onAction={async () => {
          await launchCommand({ name: "ddiscord-stream-screen-1", type: LaunchType.Background });
        }}
      />
      <MenuBarExtra.Item
        title="Stream screen 2"
        onAction={async () => {
          await launchCommand({ name: "ddiscord-stream-screen-2", type: LaunchType.Background });
        }}
      />
      <MenuBarExtra.Item
        title="Stop Stream"
        onAction={async () => {
          await launchCommand({ name: "ddiscord-stop-stream", type: LaunchType.Background });
        }}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="Toggle Speaker"
        onAction={async () => {
          await launchCommand({ name: "ddiscord-toggle-speaker", type: LaunchType.Background });
        }}
      />
      <MenuBarExtra.Separator />
      <MenuBarExtra.Submenu title={"System"}>
        <MenuBarExtra.Item
          title="Launch discord"
          onAction={async () => {
            await launchCommand({ name: "ddiscord-launch-discord", type: LaunchType.Background });
          }}
        />
        <MenuBarExtra.Item
          title="Inject discord wrapper"
          onAction={async () => {
            await launchCommand({ name: "ddiscord-inject-wrapper", type: LaunchType.Background });
          }}
        />
      </MenuBarExtra.Submenu>
    </MenuBarExtra>
  );
}
