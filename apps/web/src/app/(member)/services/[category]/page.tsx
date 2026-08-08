import { ServicesCategoryScreen } from "@/screens/ServicesCategoryScreen";

export default async function ServicesCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <ServicesCategoryScreen category={category} />;
}
