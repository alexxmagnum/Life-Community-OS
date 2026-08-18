"use client";

/**
 * Location ficha — Location SoT + Experience Resolver + lifestyle profile.
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import {
  demoPlaceProfileFor,
  openDirectionsUrl,
  openLocationContact,
  resolveLocationExperience,
  useTenantLocations,
} from "@/lib/location";
import { useTenant } from "@/providers/TenantProvider";

export function LocationDetailScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { configuration, role, tenantSlug } = useTenant();
  const locationId = typeof params.id === "string" ? params.id : "";
  const { allLocations, seedReady, refresh } = useTenantLocations(
    configuration.tenantId,
  );
  const [saving, setSaving] = useState(false);
  const [editSummary, setEditSummary] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<string | null>(null);
  const [editContact, setEditContact] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canManage = role === "administrator" || role === "moderator";

  const location = useMemo(
    () => allLocations.find((item) => item.id === locationId) ?? null,
    [allLocations, locationId],
  );

  const experience = useMemo(
    () => (location ? resolveLocationExperience(location) : null),
    [location],
  );

  const profile = useMemo(() => {
    if (!location) return null;
    const demo = demoPlaceProfileFor({
      id: location.id,
      name: location.name,
    });
    return {
      imageUrl: location.imageUrl ?? demo?.imageUrl,
      summary: location.summary ?? demo?.summary,
      hours: location.hours ?? demo?.hours,
      contact: location.contact ?? demo?.contact,
    };
  }, [location]);

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
      setMessage("Cambios guardados.");
      setEditSummary(null);
      setEditHours(null);
      setEditContact(null);
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
              {experience.categoryLabel}
            </p>
            <h1 className="mt-1 text-[22px] font-semibold text-white">
              {location.name}
            </h1>
          </div>
        </div>

        <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          {profile?.summary ?? experience.summary}
        </p>

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

        {location.contact ? (
          <div className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
              Contacto
            </p>
            <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
              {location.contact}
            </p>
          </div>
        ) : null}

        {canManage ? (
          <div className="space-y-3 rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4">
            <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
              Gestionar lugar
            </p>
            <label className="block text-[13px] text-[var(--color-text-secondary)]">
              Resumen
              <textarea
                className="mt-1 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent p-2 text-[15px]"
                rows={3}
                value={editSummary ?? location.summary ?? ""}
                onChange={(e) => setEditSummary(e.target.value)}
              />
            </label>
            <label className="block text-[13px] text-[var(--color-text-secondary)]">
              Horario
              <input
                className="mt-1 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent p-2 text-[15px]"
                value={editHours ?? location.hours ?? ""}
                onChange={(e) => setEditHours(e.target.value)}
              />
            </label>
            <label className="block text-[13px] text-[var(--color-text-secondary)]">
              Contacto
              <input
                className="mt-1 w-full rounded-[12px] border border-[var(--color-border-subtle)] bg-transparent p-2 text-[15px]"
                value={editContact ?? location.contact ?? ""}
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
          {location.contact ? (
            <button
              type="button"
              className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
              onClick={() => openLocationContact(location.contact)}
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
