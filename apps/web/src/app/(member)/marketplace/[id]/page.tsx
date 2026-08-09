import { MarketplaceDetailScreen } from "@/screens/MarketplaceDetailScreen";

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarketplaceDetailScreen listingId={id} />;
}
