import { IconLoader2 } from "@tabler/icons-react";

export function AgentLoading() {
  return (
    <div data-testid="agent-loading-spinner">
      <IconLoader2
        size={16}
        stroke={1.5}
        className="animate-spin"
        color="white"
      />
    </div>
  );
}
