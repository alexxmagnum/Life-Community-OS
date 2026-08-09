"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createExperience,
  getExplorerActivityBySlug,
  listExplorerActivityHubs,
  listResources,
  listResourcesForActivity,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

function toDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function combineLocalDateTime(date: string, time: string): string {
  const iso = new Date(`${date}T${time}:00`);
  return iso.toISOString();
}

/**
 * Resident create-experience flow — temporary community moments.
 * Demo session storage only (no backend persistence).
 */
export function CreateExperienceScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, isFeatureEnabled, hasCapability, demoMember } = useTenant();
  const { join } = useExperienceParticipation();

  const hubs = listExplorerActivityHubs();
  const initialActivity = searchParams.get("activity") ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activitySlug, setActivitySlug] = useState(
    hubs.some((h) => h.slug === initialActivity) ? initialActivity : "",
  );
  const [date, setDate] = useState(toDateInputValue());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resources = useMemo(() => {
    if (activitySlug) return listResourcesForActivity(activitySlug);
    return listResources().slice(0, 12);
  }, [activitySlug]);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las experiencias no están disponibles"
        description="Esta comunidad aún no ha activado las experiencias."
        actionLabel="Volver al inicio"
        onAction={() => router.push("/")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceCreate)) {
    return (
      <EmptyState
        title="Sin permiso para crear"
        description="Tu cuenta no puede crear experiencias ahora mismo."
        actionLabel="Ver experiencias"
        onAction={() => router.push("/experiences")}
      />
    );
  }

  const onSubmit = () => {
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();
    const cap = Number(capacity);

    if (!trimmedTitle) {
      setError("Pon un título para tu experiencia.");
      return;
    }
    if (!trimmedDescription) {
      setError("Cuenta un poco más: qué vais a hacer.");
      return;
    }
    if (!date || !startTime) {
      setError("Elige fecha y hora de inicio.");
      return;
    }
    if (!trimmedLocation) {
      setError("Indica dónde os encontráis.");
      return;
    }
    if (!Number.isFinite(cap) || cap < 2) {
      setError("La capacidad debe ser al menos 2 personas.");
      return;
    }

    const startsAt = combineLocalDateTime(date, startTime);
    if (Number.isNaN(new Date(startsAt).getTime())) {
      setError("La fecha u hora no es válida.");
      return;
    }

    let endsAt: string | undefined;
    if (endTime) {
      endsAt = combineLocalDateTime(date, endTime);
      if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        setError("La hora de fin debe ser posterior al inicio.");
        return;
      }
    }

    const hub = activitySlug
      ? getExplorerActivityBySlug(activitySlug)
      : undefined;

    setSubmitting(true);
    try {
      const created = createExperience({
        title: trimmedTitle,
        description: trimmedDescription,
        startsAt,
        endsAt,
        location: trimmedLocation,
        capacity: cap,
        activitySlug: hub?.slug,
        resourceId: resourceId || undefined,
        imageUrl: hub?.imageUrl,
        areaLabel: demoMember.areaLabel || theme.identity?.defaultAreaName,
        organizer: {
          id: demoMember.personId,
          name: demoMember.displayName,
          avatarUrl: demoMember.avatarUrl,
          roleLabel: "Vecino",
        },
        channelId: hub?.channelIds?.[0],
        groupId: hub?.groupIds?.[0],
      });
      join(created.id, { reminders: true });
      router.push(`/experiences/${created.id}`);
    } catch {
      setError("No se pudo crear la experiencia. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  };

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-subtle)] bg-white px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Crear experiencia"
        subtitle="Tienes una idea: invita a tus vecinos a un momento concreto."
        onBack={() => router.push("/experiences")}
        onExit={() => router.push("/")}
      />

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Información básica
        </h2>
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Título
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Partida de pádel el viernes"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Descripción
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué vais a hacer, para quién es, qué hay que traer…"
            rows={4}
            className={`${fieldClass} min-h-[120px] resize-none py-3`}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Actividad relacionada
        </h2>
        <p className="text-[15px] text-[var(--color-text-tertiary)]">
          Opcional — ayuda a que la gente la encuentre en el hub correcto.
        </p>
        <label className="block space-y-1.5">
          <span className="sr-only">Actividad</span>
          <select
            value={activitySlug}
            onChange={(e) => {
              setActivitySlug(e.target.value);
              setResourceId("");
            }}
            className={fieldClass}
          >
            <option value="">Sin actividad concreta</option>
            {hubs.map((hub) => (
              <option key={hub.slug} value={hub.slug}>
                {hub.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Fecha y hora
        </h2>
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Fecha
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Inicio
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Fin (opcional)
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Lugar
        </h2>
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Punto de encuentro
          </span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej. Entrada del camino de pinos"
            className={fieldClass}
          />
        </label>
        {resources.length > 0 ? (
          <label className="block space-y-1.5">
            <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Recurso relacionado (opcional)
            </span>
            <select
              value={resourceId}
              onChange={(e) => {
                const id = e.target.value;
                setResourceId(id);
                const res = resources.find((r) => r.id === id);
                if (res && !location.trim()) setLocation(res.location);
              }}
              className={fieldClass}
            >
              <option value="">Ninguno</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Capacidad
        </h2>
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Máximo de participantes
          </span>
          <input
            type="number"
            min={2}
            max={200}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={fieldClass}
          />
        </label>
      </section>

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]">
        <p className="text-[14px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Organizador
        </p>
        <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
          Organizado por {demoMember.displayName}
        </p>
        <p className="mt-0.5 text-[15px] text-[var(--color-text-secondary)]">
          Como vecino de la comunidad — no hace falta ser administrador.
        </p>
      </section>

      {error ? (
        <p className="text-[14px] font-medium text-[var(--color-action-destructive)]">
          {error}
        </p>
      ) : null}

      <ScreenPrimaryAction
        label={submitting ? "Creando…" : "Publicar experiencia"}
        onClick={onSubmit}
        disabled={submitting}
      />
    </MobileScreen>
  );
}
