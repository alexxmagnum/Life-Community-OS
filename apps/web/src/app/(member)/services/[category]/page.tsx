import { redirect } from "next/navigation";
import { ProfessionalsHubScreen } from "@/screens/ProfessionalsHubScreen";
import { ServicesCategoryScreen } from "@/screens/ServicesCategoryScreen";

export default async function ServicesCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (category === "neighbour-help") {
    redirect("/community");
  }
  if (category === "professionals") {
    return <ProfessionalsHubScreen />;
  }
  return <ServicesCategoryScreen category={category} />;
}
