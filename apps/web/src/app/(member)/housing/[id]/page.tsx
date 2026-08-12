import { HousingDetailScreen } from "@/screens/HousingDetailScreen";

export default async function HousingListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HousingDetailScreen listingId={id} />;
}
