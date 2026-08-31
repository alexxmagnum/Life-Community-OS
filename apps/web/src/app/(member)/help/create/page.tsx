import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { HelpComposerScreen } from "@/screens/HelpComposerScreen";

export default function HelpCreatePage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <HelpComposerScreen />
    </Suspense>
  );
}
