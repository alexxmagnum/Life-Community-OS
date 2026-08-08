import { ExperienceConversationScreen } from "@/screens/ExperienceConversationScreen";

export default async function ExperienceConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExperienceConversationScreen experienceId={id} />;
}
