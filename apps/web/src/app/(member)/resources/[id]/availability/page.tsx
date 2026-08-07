import { ResourceAvailabilityScreen } from "@/screens/ResourceAvailabilityScreen";

export default async function ResourceAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceAvailabilityScreen resourceId={id} />;
}
