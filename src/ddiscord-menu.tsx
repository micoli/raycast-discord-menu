import { Icon, launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";
import VoiceMembersSection from "./components/voice-members-section";
import type { DiscordState } from "./injected/messages";
import { menuIcon } from "./menu-icon";
import { useDiscordState } from "./use-discord-state";

type MenuContext = {
  // Undefined while the state is unknown: discord stopped, without debugger or not read yet
  state?: DiscordState;
  running: boolean;
};

type MenuCommand = {
  title: string | ((context: MenuContext) => string);
  icon: Icon;
  command: string;
  // Commands depending on the discord state are disabled while it is unknown
  isEnabled?: (context: MenuContext) => boolean;
};

const canStartStream = ({ state }: MenuContext) => Boolean(state?.connected && !state.sharing);

const voiceCommands: MenuCommand[] = [
  { title: "Stream screen 1", icon: Icon.Number01, command: "ddiscord-stream-screen-1", isEnabled: canStartStream },
  { title: "Stream screen 2", icon: Icon.Number02, command: "ddiscord-stream-screen-2", isEnabled: canStartStream },
  {
    title: "Stop Stream",
    icon: Icon.Stop,
    command: "ddiscord-stop-stream",
    isEnabled: ({ state }) => Boolean(state?.sharing),
  },
];

const audioCommands: MenuCommand[] = [
  {
    title: "Mute",
    icon: Icon.MicrophoneDisabled,
    command: "ddiscord-mute",
    isEnabled: ({ state }) => Boolean(state) && !state?.muted,
  },
  {
    title: "Unmute",
    icon: Icon.Microphone,
    command: "ddiscord-unmute",
    isEnabled: ({ state }) => Boolean(state?.muted),
  },
  {
    title: "Deafen",
    icon: Icon.SpeakerOff,
    command: "ddiscord-deafen",
    isEnabled: ({ state }) => Boolean(state) && !state?.deafened,
  },
  {
    title: "Undeafen",
    icon: Icon.Speaker,
    command: "ddiscord-undeafen",
    isEnabled: ({ state }) => Boolean(state?.deafened),
  },
];

const toggleAudioCommands: MenuCommand[] = [
  { title: "Toggle Microphone", icon: Icon.Microphone, command: "ddiscord-toggle-microphone" },
  { title: "Toggle Speaker", icon: Icon.Speaker, command: "ddiscord-toggle-speaker" },
];

// Launching also relaunches discord when it runs without the debugger
const processCommands: MenuCommand[] = [
  {
    title: ({ state, running }) => (running && !state ? "Relaunch Discord with debugger" : "Launch Discord"),
    icon: Icon.AppWindow,
    command: "ddiscord-launch-discord",
    isEnabled: ({ state }) => state === undefined,
  },
  {
    title: "Stop Discord",
    icon: Icon.XMarkCircle,
    command: "ddiscord-stop-discord",
    isEnabled: ({ running }) => running,
  },
];

export default function Command() {
  const { data, error, isLoading, running } = useDiscordState();
  const context: MenuContext = { state: error ? undefined : data, running: running ?? Boolean(data) };

  // An item without onAction is rendered disabled by raycast
  const renderItem = ({ title, icon, command, isEnabled }: MenuCommand, type = LaunchType.Background) => {
    const enabled = !isEnabled || isEnabled(context);
    return (
      <MenuBarExtra.Item
        key={command}
        title={typeof title === "function" ? title(context) : title}
        icon={icon}
        onAction={enabled ? () => launchCommand({ name: command, type }) : undefined}
      />
    );
  };

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
      {processCommands.map((item) => renderItem(item))}
    </MenuBarExtra>
  );
}
