import { ActivityDetailScreen } from "@/screens/ActivityDetailScreen";

export default async function ActivityHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ActivityDetailScreen slug={slug} />;
}
