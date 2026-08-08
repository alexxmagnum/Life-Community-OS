import { WorkConversationScreen } from "@/screens/WorkConversationScreen";

export default async function WorkConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkConversationScreen workPostId={id} />;
}
