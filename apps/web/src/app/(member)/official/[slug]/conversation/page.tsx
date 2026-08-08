import { OfficialConversationScreen } from "@/screens/OfficialConversationScreen";

export default async function OfficialConversationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OfficialConversationScreen slug={slug} />;
}
