import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { HousingComposerScreen } from "@/screens/HousingComposerScreen";

export default function HousingCreatePage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <HousingComposerScreen />
    </Suspense>
  );
}
