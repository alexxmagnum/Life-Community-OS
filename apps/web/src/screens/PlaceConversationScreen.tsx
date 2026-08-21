"use client";

import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export function PlaceConversationScreen({ placeId }: { placeId: string }) {
  return (
    <CommunicationThreadScreen
      type="context"
      contextType="community"
      contextId={`place:${placeId}`}
      title="Lugar"
      subtitle="Conversación de este lugar"
      reason="Cerca"
      backHref={`/near/place/${placeId}`}
    />
  );
}
