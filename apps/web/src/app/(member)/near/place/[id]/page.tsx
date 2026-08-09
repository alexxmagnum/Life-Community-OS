import { LocalPlaceDetailScreen } from "@/screens/LocalPlaceDetailScreen";

export default async function LocalPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocalPlaceDetailScreen placeId={id} />;
}
