import { ExperienceRegistrationScreen } from "@/screens/ExperienceRegistrationScreen";

export default async function ExperienceJoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExperienceRegistrationScreen experienceId={id} />;
}
