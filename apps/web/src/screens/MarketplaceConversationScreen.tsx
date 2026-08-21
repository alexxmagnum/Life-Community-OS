"use client";

import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export function MarketplaceConversationScreen({
  listingId,
}: {
  listingId: string;
}) {
  return (
    <CommunicationThreadScreen
      type="context"
      contextType="marketplace"
      contextId={listingId}
      title="Anuncio"
      subtitle="Conversación sobre este anuncio"
      reason="Marketplace"
      backHref={`/marketplace/${listingId}`}
    />
  );
}
