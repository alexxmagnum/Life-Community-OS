"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  housingAvailabilityLabel,
  housingPropertyStatusLabel,
  housingPropertyTypeLabel,
  propertyMembershipRoleLabel,
  type PropertyMembership,
  type PropertyPublicView,
} from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  HousingDetail,
  MobileScreen,
} from "@life-community-os/ui";
import {
  addHousingMemberRequest,
  fetchHousingProperty,
  patchHousingPropertyRequest,
  propertyCoverUrl,
  propertyFacts,
} from "@/lib/housing/housing-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useHousingSaves } from "@/providers/HousingSavesProvider";
import { useEntityMedia } from "@/lib/media/use-entity-media";

export function HousingDetailScreen({ listingId }: { listingId: string }) {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    configuration,
    personId,
  } = useTenant();
  const { isSaved, toggleSave } = useHousingSaves();
  const { items: mediaItems, coverUrl } = useEntityMedia(
    "property",
    listingId,
  );
  const [ready, setReady] = useState(false);
  const [property, setProperty] = useState<PropertyPublicView | null>(null);
  const [memberships, setMemberships] = useState<PropertyMembership[] | undefined>();
  const [memberId, setMemberId] = useState("");
  const [saving, setSaving] = useState(false);

  const moduleOn =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await fetchHousingProperty(configuration.tenantId, listingId);
      if (cancelled) return;
      setProperty(row?.property ?? null);
      setMemberships(row?.memberships);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, listingId]);

  if (!moduleOn) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Vivienda no está disponible"
          actionLabel="Volver"
          onAction={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.housingView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState title="Sin acceso" />
      </MobileScreen>
    );
  }

  if (!ready) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
      </MobileScreen>
    );
  }

  if (!property) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Vivienda"
          onBack={() => router.push("/housing")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Vivienda no encontrada"
          description="No existe o no forma parte de tu comunidad."
          actionLabel="Explorar vivienda"
          onAction={() => router.push("/housing")}
        />
      </MobileScreen>
    );
  }

  const isOwner = property.viewerRole === "owner";
  const saved = isSaved(property.id);
  const cover = propertyCoverUrl(property, coverUrl);

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={housingPropertyTypeLabel(property.propertyType)}
        onBack={() => router.push("/housing")}
        onExit={() => router.push("/")}
      />

      <HousingDetail
        categoryLabel={housingPropertyTypeLabel(property.propertyType)}
        statusLabel={housingPropertyStatusLabel(property.status)}
        title={property.title}
        description={property.description}
        locationLabel={[
          property.areaLabel,
          housingAvailabilityLabel(property.availability),
          property.viewerRole
            ? propertyMembershipRoleLabel(
                property.viewerRole as "owner" | "resident" | "tenant" | "family_member",
              )
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        facts={propertyFacts(property)}
        media={
          mediaItems.length > 0
            ? mediaItems.map((item) => ({ id: item.asset.id, url: item.url }))
            : cover
              ? [{ id: "cover", url: cover }]
              : []
        }
        actions={
          <>
            {memberships && memberships.length > 0 ? (
              <div className="rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3.5">
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                  Hogar
                </p>
                <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
                  {memberships.map((item) => (
                    <li key={item.id}>
                      {propertyMembershipRoleLabel(item.relationshipType)}
                      {item.personId === personId ? " · tú" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3.5 text-[13px] leading-5 text-[var(--color-text-secondary)]">
                Los datos del hogar se muestran solo a quien vive o posee esta
                vivienda.
              </p>
            )}

            {isOwner ? (
              <div className="space-y-2">
                <input
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="Id de persona residente"
                  className="min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px]"
                />
                <button
                  type="button"
                  disabled={saving || memberId.trim().length < 3}
                  onClick={() =>
                    void (async () => {
                      setSaving(true);
                      await addHousingMemberRequest({
                        tenantId: configuration.tenantId,
                        propertyId: property.id,
                        personId: memberId.trim(),
                        role: "resident",
                      });
                      const row = await fetchHousingProperty(
                        configuration.tenantId,
                        property.id,
                      );
                      setMemberships(row?.memberships);
                      setMemberId("");
                      setSaving(false);
                    })()
                  }
                  className="w-full rounded-[14px] border border-[var(--color-border-subtle)] px-4 py-3 text-[14px] font-semibold"
                >
                  Añadir residente
                </button>
                <button
                  type="button"
                  disabled={saving || property.status === "archived"}
                  onClick={() =>
                    void (async () => {
                      setSaving(true);
                      await patchHousingPropertyRequest({
                        tenantId: configuration.tenantId,
                        propertyId: property.id,
                        status: "archived",
                      });
                      setSaving(false);
                      router.push("/housing/mine");
                    })()
                  }
                  className="w-full rounded-[14px] border border-[var(--color-border-subtle)] px-4 py-3 text-[14px] font-semibold"
                >
                  Archivar vivienda
                </button>
              </div>
            ) : null}

            {hasCapability(CAPABILITIES.housingSave) ? (
              <button
                type="button"
                onClick={() => toggleSave(property.id)}
                className="flex w-full items-center justify-center rounded-[14px] border border-[var(--color-border-subtle)] px-4 py-3 text-[14px] font-semibold text-[var(--color-text-primary)]"
              >
                {saved ? "Quitar de guardados" : "Guardar"}
              </button>
            ) : null}
          </>
        }
      />
    </MobileScreen>
  );
}
