import { GroupConversationScreen } from "@/screens/GroupConversationScreen";

export default async function GroupConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupConversationScreen groupId={id} />;
}
