import { ProfessionalTradeStubScreen } from "@/screens/ProfessionalTradeStubScreen";

export default async function ProfessionalTradePage({
  params,
}: {
  params: Promise<{ category: string; trade: string }>;
}) {
  const { category, trade } = await params;

  // Only professionals owns nested trade routes for now.
  if (category !== "professionals") {
    return <ProfessionalTradeStubScreen tradeId="__invalid__" />;
  }

  return <ProfessionalTradeStubScreen tradeId={trade} />;
}
