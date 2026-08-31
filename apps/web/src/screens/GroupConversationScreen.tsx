"use client";

import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export function GroupConversationScreen({ groupId }: { groupId: string }) {
  return (
    <CommunicationThreadScreen
      type="group"
      contextType="group"
      contextId={groupId}
      title="Grupo"
      subtitle="Conversación del grupo"
      reason="Grupo"
      backHref={`/community/groups/${groupId}`}
    />
  );
}
