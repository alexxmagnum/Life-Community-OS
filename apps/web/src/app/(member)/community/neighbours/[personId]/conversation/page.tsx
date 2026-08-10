import { NeighbourConversationScreen } from "@/screens/NeighbourConversationScreen";

export default async function NeighbourConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { personId } = await params;
  const { from } = await searchParams;
  return (
    <NeighbourConversationScreen
      peerPersonId={personId}
      fromContentId={from}
    />
  );
}
