import { Icon, launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";
import VoiceMembersSection from "./components/voice-members-section";
import { menuIcon } from "./menu-icon";
import { useDiscordState } from "./use-discord-state";

const REFRESH_INTERVAL_MS = 2500;

type MenuCommand = { title: string; icon: Icon; command: string };

const voiceCommands: MenuCommand[] = [
  { title: "Stream screen 1", icon: Icon.Number01, command: "ddiscord-stream-screen-1" },
  { title: "Stream screen 2", icon: Icon.Number02, command: "ddiscord-stream-screen-2" },
  { title: "Stop Stream", icon: Icon.Stop, command: "ddiscord-stop-stream" },
];

const audioCommands: MenuCommand[] = [
  { title: "Mute", icon: Icon.MicrophoneDisabled, command: "ddiscord-mute" },
  { title: "Unmute", icon: Icon.Microphone, command: "ddiscord-unmute" },
  { title: "Deafen", icon: Icon.SpeakerOff, command: "ddiscord-deafen" },
  { title: "Undeafen", icon: Icon.Speaker, command: "ddiscord-undeafen" },
];
const toggleAudioCommands: MenuCommand[] = [
  { title: "Toggle Microphone", icon: Icon.Microphone, command: "ddiscord-toggle-microphone" },
  { title: "Toggle Speaker", icon: Icon.Speaker, command: "ddiscord-toggle-speaker" },
];

export default function Command() {
  const { data, error, isLoading } = useDiscordState(REFRESH_INTERVAL_MS);

  const renderItem = ({ title, icon, command }: MenuCommand, type = LaunchType.Background) => (
    <MenuBarExtra.Item
      key={command}
      title={title}
      icon={icon}
      onAction={() => launchCommand({ name: command, type })}
    />
  );

  return (
    <MenuBarExtra isLoading={isLoading} icon={menuIcon(error ? undefined : data)} tooltip="Discord helper">
      {voiceCommands.map((item) => renderItem(item))}
      <MenuBarExtra.Separator />
      {audioCommands.map((item) => renderItem(item))}
      <VoiceMembersSection state={data?.voice} error={error} />
      {renderItem(
        { title: "Open live members list", icon: Icon.List, command: "ddiscord-voice-members" },
        LaunchType.UserInitiated,
      )}
      <MenuBarExtra.Separator />
      {toggleAudioCommands.map((item) => renderItem(item))}
      <MenuBarExtra.Separator />
      {renderItem({ title: "Launch discord", icon: Icon.AppWindow, command: "ddiscord-launch-discord" })}
      <MenuBarExtra.Submenu title="Debug">
        {renderItem({ title: "Inject discord wrapper", icon: Icon.Envelope, command: "ddiscord-inject-wrapper" })}
      </MenuBarExtra.Submenu>
    </MenuBarExtra>
  );
}
