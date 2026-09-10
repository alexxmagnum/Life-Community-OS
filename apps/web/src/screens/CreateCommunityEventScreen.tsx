"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileScreen } from "@life-community-os/ui";

/**
 * Legacy CommunityEvent create route — redirects to the unified Experience composer.
 * Route kept for compatibility. New events write Experience(kind=event) only.
 * Do not dual-write CommunityEvent from this entry (Phase 3 migrates legacy data).
 */
export function CreateCommunityEventScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("kind", "event");
    const locationId = searchParams.get("locationId")?.trim();
    const location =
      searchParams.get("location")?.trim() ||
      searchParams.get("locationName")?.trim();
    if (locationId) params.set("locationId", locationId);
    if (location) params.set("locationName", location);
    router.replace(`/experiences/create?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <MobileScreen>
      <p className="px-4 py-8 text-[15px] text-[var(--color-text-secondary)]">
        Abriendo el compositor…
      </p>
    </MobileScreen>
  );
}
