import { MarketplaceConversationScreen } from "@/screens/MarketplaceConversationScreen";

export default async function MarketplaceConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarketplaceConversationScreen listingId={id} />;
}
