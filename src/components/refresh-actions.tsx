import { Action, ActionPanel, Icon } from "@raycast/api";

type Props = {
  onRefresh: () => void;
};

export default function RefreshActions({ onRefresh }: Props) {
  return (
    <ActionPanel>
      <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={onRefresh} />
    </ActionPanel>
  );
}
