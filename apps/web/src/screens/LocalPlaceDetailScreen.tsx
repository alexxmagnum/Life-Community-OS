"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import { useTenantLocations } from "@/lib/location";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Legacy /near/place/:id — redirects to Location ficha (single SoT).
 */
export function LocalPlaceDetailScreen({ placeId }: { placeId: string }) {
  const router = useRouter();
  const { configuration, isFeatureEnabled, hasCapability } = useTenant();
  const { allLocations, seedReady } = useTenantLocations(configuration.tenantId);

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  useEffect(() => {
    if (!seedReady || !canLocal) return;
    const target = placeId.trim();
    const match =
      allLocations.find((item) => item.id === target) ??
      allLocations.find((item) =>
        item.id.includes(`loc-catalog-${target}-`),
      ) ??
      allLocations.find(
        (item) => item.name.toLowerCase() === target.toLowerCase(),
      );
    if (match) {
      router.replace(`/locations/${encodeURIComponent(match.id)}`);
    }
  }, [seedReady, canLocal, allLocations, placeId, router]);

  if (!canLocal) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Cerca"
          onBack={() => router.back()}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin acceso"
          description="Este lugar no está disponible para tu cuenta."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Lugar"
        onBack={() => router.back()}
        onExit={() => router.push("/")}
      />
      <p className="mt-8 text-[15px] text-[var(--color-text-secondary)]">
        {seedReady ? "Redirigiendo a la ficha…" : "Cargando lugar…"}
      </p>
      {seedReady ? (
        <EmptyState
          title="Lugar no encontrado"
          actionLabel="Ver mapa"
          onAction={() => router.push("/map")}
        />
      ) : null}
    </MobileScreen>
  );
}
