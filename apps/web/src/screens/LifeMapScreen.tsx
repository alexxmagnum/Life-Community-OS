"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import {
  buildLifeMapContextPanel,
  buildLifeMapInteraction,
  emitLifeMapTelemetry,
  type LifeMapContextPanelModel,
} from "@life-community-os/life-map-renderer";
import type { LifeMapActionKind, LifeMapObject } from "@life-community-os/types";
import { LifeMapContextPanel } from "@/components/life-map/LifeMapContextPanel";
import { LifeMapViewport } from "@/components/life-map/LifeMapViewport";
import {
  getLifeMapDevEngine,
  isLifeMapDevPreviewEnabled,
  isLifeMapHybrid3DPreviewEnabled,
} from "@/lib/life-map-dev";
import { ensureLifeMapTenantPacksRegistered } from "@/lib/life-map-tenant-registry";
import { resolveLifeMapTenantPack } from "@/lib/life-map-tenant-pack";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

ensureLifeMapTenantPacksRegistered();

/**
 * Life Map experience shell — tenant pack driven (multi-tenant ready).
 */
export function LifeMapScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    configuration,
    demoPersonId,
  } = useTenant();

  const devPreview = isLifeMapDevPreviewEnabled();
  const previewEngine = getLifeMapDevEngine();
  const hybrid3D = isLifeMapHybrid3DPreviewEnabled();
  const moduleOn =
    devPreview ||
    (isModuleEnabled("lifeMap") && isFeatureEnabled("lifeMap"));
  const canView = hasCapability(CAPABILITIES.lifeMapView);

  const pack = useMemo(
    () => resolveLifeMapTenantPack(configuration.tenantId),
    [configuration.tenantId],
  );

  const objects = useMemo(() => pack?.listObjects() ?? [], [pack]);
  const territoryDataResolver = useMemo(
    () => pack?.createTerritoryDataResolver(),
    [pack],
  );

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    null,
  );

  const selectedObject: LifeMapObject | null = useMemo(() => {
    if (!selectedObjectId) return null;
    return objects.find((o) => o.objectId === selectedObjectId) ?? null;
  }, [objects, selectedObjectId]);

  const contextModel: LifeMapContextPanelModel | null = useMemo(() => {
    if (!selectedObject) return null;
    const enrichment = pack?.enrichContext?.(selectedObject) ?? null;
    return buildLifeMapContextPanel(selectedObject, enrichment);
  }, [selectedObject, pack]);

  useEffect(() => {
    if (!pack) return;
    emitLifeMapTelemetry({
      type: "life_map.opened",
      tenantId: pack.tenantId,
      territoryId: pack.territory.territoryId,
      dataVersion: pack.dataVersion,
    });
  }, [pack]);

  const onObjectSelect = useCallback(
    (objectId: string | null) => {
      setSelectedObjectId(objectId);
      if (objectId && pack) {
        const obj = objects.find((o) => o.objectId === objectId);
        if (obj) {
          emitLifeMapTelemetry({
            type: "life_map.object_selected",
            tenantId: pack.tenantId,
            objectId: obj.objectId,
            objectType: obj.type,
          });
        }
      }
    },
    [objects, pack],
  );

  const communityPulse = useMemo(() => {
    const experiences = objects.filter((o) => o.type === "experience").length;
    const alerts = objects.filter((o) => o.type === "community").length;
    const services = objects.filter((o) => o.type === "service").length;
    return { experiences, alerts, services };
  }, [objects]);

  const onContextAction = useCallback(
    (action: LifeMapActionKind) => {
      if (!selectedObject) return;
      const intent = buildLifeMapInteraction({
        object: selectedObject,
        action,
        actorPersonId: demoPersonId,
      });

      // Domain handoff — map never owns booking / messaging SoT.
      if (action === "open" || action === "navigate" || action === "join") {
        const entityId = intent.ref?.entityId;
        if (
          intent.ref?.moduleId === "community" &&
          intent.ref.entityKind === "community_alert"
        ) {
          router.push("/community?tab=actualidad");
          return;
        }
        if (intent.ref?.moduleId === "community" && entityId) {
          router.push(`/local/${entityId}`);
          return;
        }
        if (intent.ref?.moduleId === "resources" && entityId) {
          router.push(`/resources/${entityId}`);
          return;
        }
        if (intent.ref?.moduleId === "experiences" && entityId) {
          router.push(`/experiences/${entityId}`);
          return;
        }
        if (intent.ref?.moduleId === "official") {
          const slug = intent.ref.entityKind;
          if (slug) {
            router.push(`/official/${slug}`);
            return;
          }
        }
        if (intent.ref?.moduleId === "housing" && entityId) {
          router.push(`/housing/${entityId}`);
          return;
        }
      }
      if (action === "message" && intent.ref?.entityId) {
        router.push(`/local/${intent.ref.entityId}`);
      }
    },
    [selectedObject, demoPersonId, router],
  );

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

  if (!pack) {
    return (
      <MobileScreen>
        <EmptyState
          title="Life Map no configurado"
          description="Este tenant aún no tiene un pack territorial registrado."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  const territory = pack.territory;
  const layers = territory.layers;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Life Map"
        subtitle={
          devPreview
            ? `${pack.territoryName} · ${
                previewEngine === "maplibre"
                  ? hybrid3D
                    ? "Twin 3D"
                    : "MapLibre"
                  : "Three"
              } (dev)`
            : pack.territoryName
        }
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <LifeMapViewport
        territory={territory}
        objects={objects}
        previewUnlocked={devPreview}
        territoryDataResolver={territoryDataResolver}
        selectedObjectId={selectedObjectId}
        onObjectSelect={onObjectSelect}
        dataVersion={pack.dataVersion}
      />

      {contextModel ? (
        <LifeMapContextPanel
          model={contextModel}
          onAction={onContextAction}
          onClose={() => setSelectedObjectId(null)}
        />
      ) : null}

      <section className="mt-5" aria-label="Pulso de la comunidad">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Ahora en la comunidad
        </h2>
        <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
          {communityPulse.experiences} experiencias · {communityPulse.alerts}{" "}
          avisos · {communityPulse.services} servicios en el twin
        </p>
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
          Vida de la comunidad
        </h2>
        {objects.length === 0 ? (
          <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
            No hay proyecciones espaciales cargadas.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border-subtle)]">
            {objects.map((object) => (
              <li key={object.objectId}>
                <button
                  type="button"
                  className="w-full py-2.5 text-left"
                  onClick={() => setSelectedObjectId(object.objectId)}
                >
                  <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                    {object.label ?? object.objectId}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                    {object.type}
                    {object.asset3DKey ? ` · ${object.asset3DKey}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MobileScreen>
  );
}
