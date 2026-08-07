import { ExperienceDetailScreen } from "@/screens/ExperienceDetailScreen";

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExperienceDetailScreen experienceId={id} />;
}
