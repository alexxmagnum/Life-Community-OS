import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { CreateCommunityEventScreen } from "@/screens/CreateCommunityEventScreen";

export default function CreateCommunityEventPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <CreateCommunityEventScreen />
    </Suspense>
  );
}
