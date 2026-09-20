import { Icon, List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import RefreshActions from "./components/refresh-actions";
import { getVoiceChannelState } from "./util";

export default function Command() {
  const { data, isLoading, revalidate } = usePromise(getVoiceChannelState);

  return (
    <List isLoading={isLoading} navigationTitle={data?.channel}>
      <List.EmptyView
        icon={Icon.SpeakerOff}
        title="Not connected to a voice channel"
        actions={<RefreshActions onRefresh={revalidate} />}
      />
      {data && (
        <List.Section title={data.channel} subtitle={`${data.members.length}`}>
          {data.members.map((member) => (
            <List.Item
              key={member.name}
              title={member.name}
              icon={member.avatarUrl ?? Icon.Person}
              actions={<RefreshActions onRefresh={revalidate} />}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
