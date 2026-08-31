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
      contextType="experience"
      contextId={experienceId}
      title="Experiencia"
      subtitle="Conversación de la experiencia"
      reason="Experiencia"
      backHref={`/experiences/${experienceId}`}
    />
  );
}
