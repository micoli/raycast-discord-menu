import { Icon, MenuBarExtra } from "@raycast/api";
import type { VoiceChannelState } from "../injected/messages";
import { memberIcon } from "../member-icon";

type Props = {
  state?: VoiceChannelState | null;
  error?: Error;
};

export default function VoiceMembersSection({ state, error }: Props) {
  if (error) {
    return (
      <MenuBarExtra.Section title="Voice members">
        <MenuBarExtra.Item title="Discord not reachable" icon={Icon.ExclamationMark} />
      </MenuBarExtra.Section>
    );
  }

  if (!state) {
    return (
      <MenuBarExtra.Section title="Voice members">
        <MenuBarExtra.Item title="Not connected to a voice channel" icon={Icon.SpeakerOff} />
      </MenuBarExtra.Section>
    );
  }

  return (
    <MenuBarExtra.Section title={`${state.channel} (${state.members.length})`}>
      {state.members.map((member) => (
        <MenuBarExtra.Item key={member.name} title={member.name} icon={memberIcon(member)} />
      ))}
    </MenuBarExtra.Section>
  );
}
