import { CommunicationThreadScreen } from "@/screens/CommunicationThreadScreen";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <CommunicationThreadScreen
      type="context"
      contextType="community"
      contextId={id}
      conversationId={id}
      title="Conversación"
      subtitle="Hilo de la comunidad"
      reason="Mensajes"
      backHref="/messages"
    />
  );
}
