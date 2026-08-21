"use client";

import { directConversationContextId } from "@life-community-os/types";
import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

export function NeighbourConversationScreen({
  peerPersonId,
}: {
  peerPersonId: string;
  fromContentId?: string;
}) {
  const { currentUser } = useCurrentUser();
  const selfId = currentUser.personId ?? "";
  return (
    <CommunicationThreadScreen
      type="direct"
      contextType="community"
      contextId={directConversationContextId(selfId || "pending", peerPersonId)}
      title="Vecino"
      subtitle="Conversación privada entre vecinos"
      reason="Vecino"
      backHref="/community"
      peerPersonIds={[peerPersonId]}
    />
  );
}
