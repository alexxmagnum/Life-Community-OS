import { Suspense } from "react";
import { LoadingState } from "@life-community-os/ui";
import { BusinessRegistrationScreen } from "@/screens/BusinessRegistrationScreen";

export default function BusinessRegisterPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <BusinessRegistrationScreen />
    </Suspense>
  );
}
