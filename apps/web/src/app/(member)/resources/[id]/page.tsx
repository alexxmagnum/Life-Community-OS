import { ResourceDetailScreen } from "@/screens/ResourceDetailScreen";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceDetailScreen resourceId={id} />;
}
