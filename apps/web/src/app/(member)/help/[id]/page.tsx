import { HelpDetailScreen } from "@/screens/HelpDetailScreen";

export default async function HelpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HelpDetailScreen helpId={id} />;
}
