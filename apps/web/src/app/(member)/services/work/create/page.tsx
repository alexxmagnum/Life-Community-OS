import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { WorkPostComposerScreen } from "@/screens/WorkPostComposerScreen";

export default function CreateWorkPostPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <WorkPostComposerScreen />
    </Suspense>
  );
}
