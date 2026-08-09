import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { MarketplaceComposerScreen } from "@/screens/MarketplaceComposerScreen";

export default function MarketplaceCreatePage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <MarketplaceComposerScreen />
    </Suspense>
  );
}
