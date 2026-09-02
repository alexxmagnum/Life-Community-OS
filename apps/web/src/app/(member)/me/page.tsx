import { Suspense } from "react";
import { ProfileScreen } from "@/screens/ProfileScreen";

export default function MePage() {
  return (
    <Suspense fallback={null}>
      <ProfileScreen />
    </Suspense>
  );
}
