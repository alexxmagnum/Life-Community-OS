import { Suspense } from "react";
import { DiscoverScreen } from "@/screens/DiscoverScreen";
import { LoadingState } from "@life-community-os/ui";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading discover" />}>
      <DiscoverScreen />
    </Suspense>
  );
}
