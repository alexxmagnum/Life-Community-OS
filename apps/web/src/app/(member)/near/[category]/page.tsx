import { NearbyCategoryScreen } from "@/screens/NearbyCategoryScreen";

export default async function NearbyCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <NearbyCategoryScreen category={category} />;
}
