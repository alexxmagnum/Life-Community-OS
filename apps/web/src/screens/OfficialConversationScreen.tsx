"use client";

import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export function OfficialConversationScreen({ slug }: { slug: string }) {
  return (
    <CommunicationThreadScreen
      type="context"
      contextType="administration"
      contextId={slug}
      title="Administración"
      subtitle="Canal oficial"
      reason="Oficial"
      backHref={`/official/${slug}`}
    />
  );
}
