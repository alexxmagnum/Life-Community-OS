"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  evaluateDemoResourceAccessForPerson,
  type CommunityResource,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  LoadingState,
  MobileScreen,
  ResourceDiscoveryCard,
  ScreenSearch,
} from "@life-community-os/ui";
import { useCatalogDomain } from "@/providers/CatalogProvider";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { resourceAccessHint } from "@/lib/demo-access-copy";

export function ResourceDiscoveryScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability, demoPersonId, roleSource } =
    useTenant();
  const [query, setQuery] = useState("");
  const { items: catalogResources, ready: catalogReady } =
    useCatalogDomain<CommunityResource>("resources");

  const roleCanReserve = hasCapability(CAPABILITIES.resourceReserve);

  const items = useMemo(() => {
    return catalogResources.filter((r) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        (r.location ?? "").toLowerCase().includes(q) ||
        (r.areaLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, catalogResources]);

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

  if (!catalogReady) {
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
          title="Sin resultados"
          description="Prueba otra búsqueda."
          actionLabel="Limpiar"
          onAction={() => setQuery("")}
        />
      ) : (
        <div className="space-y-4">
          {items.map((resource) => {
            const href = `/resources/${resource.id}`;
            const access =
              roleSource === "demo"
                ? evaluateDemoResourceAccessForPerson(
                    resource.id,
                    demoPersonId,
                    roleCanReserve,
                  )
                : {
                    canViewPublicInfo: true,
                    canReserve: roleCanReserve,
                    reasons: roleCanReserve
                      ? []
                      : ["missing_reserve_permission"],
                  };
            const { hint, tone } = resourceAccessHint(access);
            const showReserve = Boolean(access.canReserve && roleCanReserve);
            return (
              <ResourceDiscoveryCard
                key={resource.id}
                name={resource.name}
                description={resource.description}
                availability={
                  showReserve
                    ? resource.availabilityPreview ?? "Consultar disponibilidad"
                    : "No disponible para ti"
                }
                area={resource.areaLabel}
                imageUrl={resource.imageUrl}
                accessHint={hint}
                accessTone={tone}
                onClick={() => router.push(href)}
                onReserve={
                  showReserve
                    ? () => router.push(`${href}/availability`)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </MobileScreen>
  );
}
