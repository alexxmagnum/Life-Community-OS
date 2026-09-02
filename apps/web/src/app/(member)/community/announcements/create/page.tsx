import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { AnnouncementCreateScreen } from "@/screens/AnnouncementCreateScreen";

export default function CreateAnnouncementPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <AnnouncementCreateScreen />
    </Suspense>
  );
}
