import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { LifeMapScreen } from "@/screens/LifeMapScreen";

export default function LifeMapPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando mapa…" />}>
      <LifeMapScreen />
    </Suspense>
  );
}
