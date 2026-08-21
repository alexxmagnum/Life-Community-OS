"use client";

import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export function WorkConversationScreen({ workPostId }: { workPostId: string }) {
  return (
    <CommunicationThreadScreen
      type="context"
      contextType="help"
      contextId={workPostId}
      title="Servicio"
      subtitle="Conversación de esta solicitud"
      reason="Ayuda"
      backHref={`/services/work/${workPostId}`}
    />
  );
}
