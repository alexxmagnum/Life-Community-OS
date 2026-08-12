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
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

/**
 * Life Map experience shell — loads territory, layers, and spatial projections.
 * No map SDK, tiles, Three.js, or 3D renderer. Viewport is a future surface placeholder.
 */
export function LifeMapScreen() {
  const router = useRouter();
  const { isFeatureEnabled, isModuleEnabled, hasCapability } = useTenant();

  const moduleOn =
    isModuleEnabled("lifeMap") && isFeatureEnabled("lifeMap");
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
        subtitle={pack.territoryName}
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      {/* Future spatial viewport — not a map engine. */}
      <section
        aria-label="Superficie espacial"
        className="relative mt-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"
        style={{
          minHeight: "min(52vh, 420px)",
          background:
            "radial-gradient(120% 90% at 50% 20%, rgba(0, 216, 232, 0.14) 0%, transparent 55%), linear-gradient(165deg, #071D25 0%, #0B252D 48%, #000000 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.35]" aria-hidden>
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
        <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-6 py-10 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-cyan,#00D8E8)]">
            Superficie espacial
          </p>
          <p className="mt-2 max-w-xs text-[15px] leading-6 text-[var(--color-text-secondary)]">
            El territorio y los objetos están cargados. El renderer llegará en una
            fase posterior.
          </p>
          <p className="mt-4 text-[13px] text-[var(--color-text-tertiary)]">
            {layers.length} capas · {objects.length} objetos
          </p>
        </div>
      </section>

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
                  {object.layerId ? ` · ${object.layerId}` : ""}
                  {object.ref
                    ? ` · ${object.ref.moduleId}/${object.ref.entityId}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileScreen>
  );
}
