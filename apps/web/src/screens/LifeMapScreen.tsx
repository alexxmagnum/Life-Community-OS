"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import {
  getLifePanoramicaLifeMapConfig,
  listLifePanoramicaSpatialObjects,
} from "@life-community-os/tenant-life-panoramica";
import { LifeMapViewport } from "@/components/life-map/LifeMapViewport";
import {
  getLifeMapDevEngine,
  isLifeMapDevPreviewEnabled,
} from "@/lib/life-map-dev";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Life Map experience shell.
 * Production: fail-closed via module + feature flags.
 * Local: optional NEXT_PUBLIC_LIFE_MAP_DEV=1 preview without flipping product flags.
 */
export function LifeMapScreen() {
  const router = useRouter();
  const { isFeatureEnabled, isModuleEnabled, hasCapability } = useTenant();

  const devPreview = isLifeMapDevPreviewEnabled();
  const previewEngine = getLifeMapDevEngine();
  const moduleOn =
    devPreview ||
    (isModuleEnabled("lifeMap") && isFeatureEnabled("lifeMap"));
  const canView = hasCapability(CAPABILITIES.lifeMapView);

  const pack = useMemo(() => getLifePanoramicaLifeMapConfig(), []);
  const objects = useMemo(() => listLifePanoramicaSpatialObjects(), []);
  const territory = pack.territory;
  const layers = territory.layers;

  if (!moduleOn) {
    return (
      <MobileScreen>
        <EmptyState
          title="Life Map no está disponible"
          description="Esta comunidad aún no ha activado el mapa espacial."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!canView) {
    return (
      <MobileScreen>
        <EmptyState
          title="Sin acceso"
          description="No puedes ver Life Map con tu cuenta actual."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Life Map"
        subtitle={
          devPreview
            ? `${pack.territoryName} · ${previewEngine === "maplibre" ? "MapLibre" : "Three"} preview (no territorio real)`
            : pack.territoryName
        }
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <LifeMapViewport
        territory={territory}
        objects={objects}
        previewUnlocked={devPreview}
      />

      <section className="mt-5" aria-label="Capas del territorio">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Capas
        </h2>
        <ul className="mt-2 divide-y divide-[var(--color-border-subtle)]">
          {layers.map((layer) => (
            <li
              key={layer.id}
              className="flex items-center justify-between py-2.5 text-[15px]"
            >
              <span className="font-medium text-[var(--color-text-primary)]">
                {layer.label ?? layer.id}
              </span>
              <span className="text-[13px] text-[var(--color-text-tertiary)]">
                {layer.visible ? "Visible" : "Oculta"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 pb-6" aria-label="Objetos espaciales">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Objetos
        </h2>
        {objects.length === 0 ? (
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            No hay proyecciones espaciales cargadas.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border-subtle)]">
            {objects.map((object) => (
              <li key={object.objectId} className="py-2.5">
                <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                  {object.label ?? object.objectId}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                  {object.type}
                  {object.asset3DKey ? ` · ${object.asset3DKey}` : ""}
                  {object.layerId ? ` · ${object.layerId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileScreen>
  );
}
