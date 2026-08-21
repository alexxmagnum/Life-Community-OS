"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunityResource } from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  LoadingState,
  MobileScreen,
  ResourceDiscoveryCard,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useReservations } from "@/providers/ReservationProvider";

function resourceMeta(resource: CommunityResource): string {
  const parts = [resource.location, resource.areaLabel].filter(Boolean);
  return parts.join(" · ");
}

export function ResourceDiscoveryScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const [query, setQuery] = useState("");
  const { resources, ready } = useReservations();

  const items = useMemo(() => {
    return resources.filter((r) => {
      if (r.category === "activity") return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.location ?? "").toLowerCase().includes(q) ||
        (r.areaLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, resources]);

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Los lugares no están disponibles"
        description="Esta comunidad aún no ha activado los espacios compartidos."
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="Los espacios compartidos no están disponibles para tu cuenta."
      />
    );
  }

  if (!ready) {
    return <LoadingState label="Cargando lugares..." />;
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Espacios compartidos"
        subtitle="Pistas, salas y zonas comunes de la comunidad."
        onBack={() => router.push("/services")}
        onExit={() => router.push("/")}
      />

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar pistas, salas, terrazas..."
        label="Buscar lugares"
      />

      {items.length === 0 ? (
        <EmptyState
          title="No hay lugares todavía"
          description="Cuando el equipo publique pistas o salas, aparecerán aquí."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((resource) => (
            <ResourceDiscoveryCard
              key={resource.id}
              name={resource.name}
              availability={resource.availabilityPreview ?? "Ver disponibilidad"}
              area={resourceMeta(resource)}
              description={resource.description}
              imageUrl={resource.images?.[0] ?? resource.imageUrl ?? ""}
              onClick={() => router.push(`/resources/${resource.id}`)}
              onReserve={() =>
                router.push(`/resources/${resource.id}/availability`)
              }
              reserveLabel="Reservar"
            />
          ))}
        </div>
      )}
    </MobileScreen>
  );
}
