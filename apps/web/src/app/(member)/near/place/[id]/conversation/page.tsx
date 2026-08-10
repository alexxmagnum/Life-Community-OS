import { PlaceConversationScreen } from "@/screens/PlaceConversationScreen";

export default async function PlaceConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlaceConversationScreen placeId={id} />;
}
