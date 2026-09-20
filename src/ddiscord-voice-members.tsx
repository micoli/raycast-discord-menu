import { Icon, List } from "@raycast/api";
import RefreshActions from "./components/refresh-actions";
import { memberIcon } from "./member-icon";
import { useDiscordState } from "./use-discord-state";

const REFRESH_INTERVAL_MS = 2000;

export default function Command() {
  const { data, error, isLoading, refresh } = useDiscordState(REFRESH_INTERVAL_MS);
  const voice = error ? null : data?.voice;

  return (
    <List isLoading={isLoading} navigationTitle={voice?.channel}>
      <List.EmptyView
        icon={error ? Icon.ExclamationMark : Icon.SpeakerOff}
        title={error ? "Discord not reachable" : "Not connected to a voice channel"}
        description={error}
        actions={<RefreshActions onRefresh={refresh} />}
      />
      {voice && (
        <List.Section title={voice.channel} subtitle={`${voice.members.length}`}>
          {voice.members.map((member) => (
            <List.Item
              key={member.name}
              title={member.name}
              icon={memberIcon(member)}
              actions={<RefreshActions onRefresh={refresh} />}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
