import { CommunityContentDetailScreen } from "@/screens/CommunityContentDetailScreen";

export default async function CommunityContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommunityContentDetailScreen contentId={id} />;
}
