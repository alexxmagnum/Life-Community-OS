import { WorkPostDetailScreen } from "@/screens/WorkPostDetailScreen";

export default async function WorkPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkPostDetailScreen workPostId={id} />;
}
