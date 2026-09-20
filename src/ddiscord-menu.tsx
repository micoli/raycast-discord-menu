import { Icon, launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";

type MenuCommand = { title: string; icon: Icon; command: string };

const voiceCommands: MenuCommand[] = [
  { title: "Stream screen 1", icon: Icon.Number01, command: "ddiscord-stream-screen-1" },
  { title: "Stream screen 2", icon: Icon.Number02, command: "ddiscord-stream-screen-2" },
  { title: "Stop Stream", icon: Icon.Stop, command: "ddiscord-stop-stream" },
];

const audioCommands: MenuCommand[] = [
  { title: "Toggle Microphone", icon: Icon.Microphone, command: "ddiscord-toggle-microphone" },
  { title: "Toggle Speaker", icon: Icon.Speaker, command: "ddiscord-toggle-speaker" },
];

export default function Command() {
  const renderItem = ({ title, icon, command }: MenuCommand, type = LaunchType.Background) => (
    <MenuBarExtra.Item
      key={command}
      title={title}
      icon={icon}
      onAction={() => launchCommand({ name: command, type })}
    />
  );

  return (
    <MenuBarExtra icon="../assets/discord_1.png" tooltip="Discord helper">
      {voiceCommands.map((item) => renderItem(item))}
      <MenuBarExtra.Separator />
      {audioCommands.map((item) => renderItem(item))}
      <MenuBarExtra.Separator />
      {renderItem(
        { title: "Voice members", icon: Icon.TwoPeople, command: "ddiscord-voice-members" },
        LaunchType.UserInitiated,
      )}
      <MenuBarExtra.Separator />
      {renderItem({ title: "Launch discord", icon: Icon.AppWindow, command: "ddiscord-launch-discord" })}
      <MenuBarExtra.Submenu title="Debug">
        {renderItem({ title: "Inject discord wrapper", icon: Icon.Envelope, command: "ddiscord-inject-wrapper" })}
      </MenuBarExtra.Submenu>
    </MenuBarExtra>
  );
}
