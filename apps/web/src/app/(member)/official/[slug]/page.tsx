import { OfficialEntityDetailScreen } from "@/screens/OfficialEntityDetailScreen";

export default async function OfficialEntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OfficialEntityDetailScreen slug={slug} />;
}
