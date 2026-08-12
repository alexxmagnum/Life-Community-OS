import { ProfessionalsHubScreen } from "@/screens/ProfessionalsHubScreen";
import { ServicesCategoryScreen } from "@/screens/ServicesCategoryScreen";

export default async function ServicesCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (category === "professionals") {
    return <ProfessionalsHubScreen />;
  }
  return <ServicesCategoryScreen category={category} />;
}
