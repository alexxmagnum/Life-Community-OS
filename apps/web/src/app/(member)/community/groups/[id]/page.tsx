import { GroupDetailScreen } from "@/screens/GroupDetailScreen";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetailScreen groupId={id} />;
}
