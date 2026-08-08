import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { CreateExperienceScreen } from "@/screens/CreateExperienceScreen";

export default function CreateExperiencePage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <CreateExperienceScreen />
    </Suspense>
  );
}
