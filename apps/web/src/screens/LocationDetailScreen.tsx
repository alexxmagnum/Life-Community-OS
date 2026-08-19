"use client";

/**
 * Location ficha — Location SoT + optional Business Profile.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { BusinessProfile } from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import {
  openDirectionsUrl,
  openLocationContact,
  resolveLocationExperience,
  useTenantLocations,
} from "@/lib/location";
import { locationCategoryLabel } from "@/lib/location/category-labels";
import {
  fetchBusinesses,
  patchBusinessRequest,
  publishBusinessRequest,
  reviewBusinessRequest,
} from "@/lib/business/business-client";
import { useTenant } from "@/providers/TenantProvider";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  pending_review: "Pendiente de revisión",
  published: "Publicado",
  suspended: "Suspendido",
  archived: "Archivado",
};

export function LocationDetailScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { configuration, role, tenantSlug, personId } = useTenant();
  const locationId = typeof params.id === "string" ? params.id : "";
  const { allLocations, seedReady, refresh } = useTenantLocations(
    configuration.tenantId,
  );
  const [saving, setSaving] = useState(false);
  const [editSummary, setEditSummary] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<string | null>(null);
  const [editContact, setEditContact] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  const isStaff = role === "administrator" || role === "moderator";

  const location = useMemo(
    () => allLocations.find((item) => item.id === locationId) ?? null,
    [allLocations, locationId],
  );

  const experience = useMemo(
    () => (location ? resolveLocationExperience(location) : null),
    [location],
  );

  const isOwner = Boolean(
    personId &&
      (location?.ownerId === personId ||
        business?.ownerPersonId === personId),
  );
  const canManage = isStaff || isOwner;

  const profile = useMemo(() => {
    if (!location) return null;
    return {
      imageUrl: business?.imageUrl ?? location.imageUrl,
      summary: business?.description ?? location.summary,
      hours: business?.hours ?? location.hours,
      contact: business?.contact ?? location.contact,
    };
  }, [location, business]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await fetchBusinesses({
        tenantId: configuration.tenantId,
        locationId,
      });
      if (cancelled) return;
      setBusiness(rows[0] ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, locationId]);

  if (!seedReady) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Lugar"
          onBack={() => router.push("/map")}
          onExit={() => router.push("/map")}
        />
        <p className="mt-8 text-[15px] text-[var(--color-text-secondary)]">
          Cargando lugar…
        </p>
      </MobileScreen>
    );
  }

  if (!location || !experience) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Lugar"
          onBack={() => router.push("/map")}
          onExit={() => router.push("/map")}
        />
        <EmptyState
          title="No encontramos este lugar"
          description="Puede haberse eliminado o pertenecer a otra comunidad."
          actionLabel="Volver al mapa"
          onAction={() => router.push("/map")}
        />
      </MobileScreen>
    );
  }

  const mapHref = `/map?focus=${encodeURIComponent(location.id)}`;

  const saveManage = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (business) {
        const result = await patchBusinessRequest({
          tenantId: tenantSlug,
          businessId: business.id,
          description: editSummary ?? business.description,
          hours: editHours ?? business.hours,
          contact: editContact ?? business.contact,
        });
        if ("error" in result) {
          setMessage("No se pudo guardar. ¿Tienes permisos?");
          return;
        }
      } else {
        const res = await fetch(
          `/api/locations/${encodeURIComponent(location.id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-tenant-slug": tenantSlug,
            },
            body: JSON.stringify({
              summary: editSummary ?? location.summary,
              hours: editHours ?? location.hours,
              contact: editContact ?? location.contact,
            }),
          },
        );
        if (!res.ok) {
          setMessage("No se pudo guardar. ¿Tienes permisos?");
          return;
        }
      }
      setMessage("Cambios guardados.");
      setEditSummary(null);
      setEditHours(null);
      setEditContact(null);
      const rows = await fetchBusinesses({
        tenantId: configuration.tenantId,
        locationId,
      });
      setBusiness(rows[0] ?? null);
      await refresh?.();
    } finally {
      setSaving(false);
    }
  };

  const removeLocation = async () => {
    if (!window.confirm(`¿Eliminar «${location.name}» de esta comunidad?`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/locations/${encodeURIComponent(location.id)}`,
        {
          method: "DELETE",
          headers: { "x-tenant-slug": tenantSlug },
        },
      );
      if (!res.ok) {
        setMessage("No se pudo eliminar.");
        return;
      }
      router.push("/map");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={location.name}
        subtitle={experience.typeHint}
        onBack={() => router.push(mapHref)}
        onExit={() => router.push("/map")}
      />

      <section className="mt-4 space-y-4 pb-28">
        <div
          className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]"
          style={{
            background: `linear-gradient(135deg, ${experience.heroTone} 0%, #f5f1e8 72%)`,
            minHeight: 200,
          }}
        >
          {profile?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(16,14,12,0.55)_100%)]" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-white/85">
              {locationCategoryLabel(location.category)}
            </p>
            <h1 className="mt-1 text-[22px] font-semibold text-white">
              {location.name}
            </h1>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {profile?.summary ?? experience.summary}
        </p>

        {business ? (
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            {STATUS_LABEL[business.status] ?? business.status}
            {isStaff ? ` · propietario ${business.ownerPersonId}` : ""}
          </p>
        ) : null}

        {profile?.hours ? (
          <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
              Horario
            </p>
            <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
              {profile.hours}
            </p>
          </div>
        ) : null}

        <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Ubicación
          </p>
          <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
            {location.geocodeDisplayName ?? location.address}
          </p>
        </div>

        {profile?.contact ? (
          <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
              Contacto
            </p>
            <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
              {profile.contact}
            </p>
          </div>
        ) : null}

        {canManage ? (
          <div className="space-y-3 rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
              Gestionar {business ? "negocio" : "lugar"}
            </p>
            <label className="block text-[13px] text-[var(--color-text-secondary)]">
              Descripción
              <textarea
                className="mt-1 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent p-2 text-[15px]"
                rows={3}
                value={editSummary ?? profile?.summary ?? ""}
                onChange={(e) => setEditSummary(e.target.value)}
              />
            </label>
            <label className="block text-[13px] text-[var(--color-text-secondary)]">
              Horario
              <input
                className="mt-1 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent p-2 text-[15px]"
                value={editHours ?? profile?.hours ?? ""}
                onChange={(e) => setEditHours(e.target.value)}
              />
            </label>
            <label className="block text-[13px] text-[var(--color-text-secondary)]">
              Contacto
              <input
                className="mt-1 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent p-2 text-[15px]"
                value={editContact ?? profile?.contact ?? ""}
                onChange={(e) => setEditContact(e.target.value)}
              />
            </label>
            {message ? (
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                {message}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                className="min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
                onClick={() => void saveManage()}
              >
                Guardar
              </button>
              {business && isOwner && business.status === "draft" ? (
                <button
                  type="button"
                  disabled={saving}
                  className="min-h-[40px] rounded-full border border-[var(--color-border-subtle)] px-4 text-[13px] font-semibold"
                  onClick={() =>
                    void (async () => {
                      setSaving(true);
                      await publishBusinessRequest({
                        tenantId: tenantSlug,
                        businessId: business.id,
                      });
                      const rows = await fetchBusinesses({
                        tenantId: configuration.tenantId,
                        locationId,
                      });
                      setBusiness(rows[0] ?? null);
                      setSaving(false);
                    })()
                  }
                >
                  Solicitar publicación
                </button>
              ) : null}
              {business && isStaff && business.status !== "published" ? (
                <button
                  type="button"
                  disabled={saving}
                  className="min-h-[40px] rounded-full border border-[var(--color-border-subtle)] px-4 text-[13px] font-semibold"
                  onClick={() =>
                    void (async () => {
                      setSaving(true);
                      await reviewBusinessRequest({
                        tenantId: tenantSlug,
                        businessId: business.id,
                        action: "approve",
                      });
                      const rows = await fetchBusinesses({
                        tenantId: configuration.tenantId,
                        locationId,
                      });
                      setBusiness(rows[0] ?? null);
                      await refresh?.();
                      setSaving(false);
                    })()
                  }
                >
                  Publicar
                </button>
              ) : null}
              {business && isStaff && business.status === "published" ? (
                <button
                  type="button"
                  disabled={saving}
                  className="min-h-[40px] rounded-full border border-[var(--color-border-subtle)] px-4 text-[13px] font-semibold"
                  onClick={() =>
                    void (async () => {
                      setSaving(true);
                      await reviewBusinessRequest({
                        tenantId: tenantSlug,
                        businessId: business.id,
                        action: "suspend",
                      });
                      const rows = await fetchBusinesses({
                        tenantId: configuration.tenantId,
                        locationId,
                      });
                      setBusiness(rows[0] ?? null);
                      await refresh?.();
                      setSaving(false);
                    })()
                  }
                >
                  Suspender
                </button>
              ) : null}
              {role === "administrator" ? (
                <button
                  type="button"
                  disabled={saving}
                  className="min-h-[40px] rounded-full border border-[var(--color-border-subtle)] px-4 text-[13px] font-semibold text-[var(--color-text-primary)]"
                  onClick={() => void removeLocation()}
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
            onClick={() => router.push(mapHref)}
          >
            Ver en el mapa
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
            onClick={() => {
              window.open(
                openDirectionsUrl(location.latitude, location.longitude),
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            Cómo llegar
          </button>
          {profile?.contact ? (
            <button
              type="button"
              className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
              onClick={() => openLocationContact(profile.contact)}
            >
              Contactar
            </button>
          ) : null}
        </div>
      </section>

      <ScreenPrimaryAction
        label="Volver al mapa"
        onClick={() => router.push(mapHref)}
      />
    </MobileScreen>
  );
}
