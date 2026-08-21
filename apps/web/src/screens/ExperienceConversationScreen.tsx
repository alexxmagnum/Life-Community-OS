"use client";

import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export function ExperienceConversationScreen({
  experienceId,
}: {
  experienceId: string;
}) {
  return (
    <CommunicationThreadScreen
      type="context"
      contextType="community"
      contextId={`experience:${experienceId}`}
      title="Experiencia"
      subtitle="Conversación de la experiencia"
      reason="Experiencia"
      backHref={`/experiences/${experienceId}`}
    />
  );
}
