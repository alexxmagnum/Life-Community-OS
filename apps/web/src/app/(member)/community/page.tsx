import { Suspense } from "react";
import { CommunityScreen } from "@/screens/CommunityScreen";
import { LoadingState } from "@life-community-os/ui";

export default function CommunityPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <CommunityScreen />
    </Suspense>
  );
}
