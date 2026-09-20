import { useEffect } from "react";
import { Icon, List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import RefreshActions from "./components/refresh-actions";
import { memberIcon } from "./member-icon";
import { getVoiceChannelState } from "./util";

const REFRESH_INTERVAL_MS = 2000;

export default function Command() {
  const { data, error, isLoading, revalidate } = usePromise(getVoiceChannelState, [], { onError: () => undefined });

  useEffect(() => {
    const timer = setInterval(revalidate, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [revalidate]);

  return (
    <List isLoading={isLoading && !data} navigationTitle={data?.channel}>
      <List.EmptyView
        icon={error ? Icon.ExclamationMark : Icon.SpeakerOff}
        title={error ? "Discord not reachable" : "Not connected to a voice channel"}
        description={error?.message}
        actions={<RefreshActions onRefresh={revalidate} />}
      />
      {!error && data && (
        <List.Section title={data.channel} subtitle={`${data.members.length}`}>
          {data.members.map((member) => (
            <List.Item
              key={member.name}
              title={member.name}
              icon={memberIcon(member)}
              actions={<RefreshActions onRefresh={revalidate} />}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
