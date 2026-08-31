"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createCommunityEventRequest } from "@/lib/community/community-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function toDateInputValue(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function combineLocalDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function CreateCommunityEventScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasCapability, configuration } = useTenant();
  const initialLocation =
    searchParams.get("location")?.trim() ||
    searchParams.get("locationName")?.trim() ||
    "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toDateInputValue());
  const [time, setTime] = useState("18:00");
  const [locationLabel, setLocationLabel] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate =
    hasCapability(CAPABILITIES.contentCreate) ||
    hasCapability(CAPABILITIES.experienceCreate);

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  if (!canCreate) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Crear evento"
          onBack={() => router.push("/community")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin permiso para crear"
          description="Tu cuenta no puede convocar eventos ahora mismo."
          actionLabel="Volver a comunidad"
          onAction={() => router.push("/community")}
        />
      </MobileScreen>
    );
  }

  const onSubmit = async () => {
    if (title.trim().length < 3) {
      setError("Pon un título para el evento.");
      return;
    }
    if (!date || !time) {
      setError("Elige fecha y hora.");
      return;
    }
    const startsAt = combineLocalDateTime(date, time);
    if (Number.isNaN(new Date(startsAt).getTime())) {
      setError("La fecha u hora no es válida.");
      return;
    }
    setSubmitting(true);
    const created = await createCommunityEventRequest({
      tenantId: configuration.tenantId,
      title: title.trim(),
      description: description.trim() || undefined,
      startsAt,
      locationLabel: locationLabel.trim() || undefined,
    });
    if ("error" in created) {
      setError("No se pudo publicar el evento.");
      setSubmitting(false);
      return;
    }
    router.push("/community");
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Crear evento"
        subtitle="Convoca a tus vecinos en el territorio activo."
        onBack={() => router.push("/community")}
        onExit={() => router.push("/")}
      />
      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Título
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Asamblea de vecinos"
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
          rows={4}
          className={`${fieldClass} min-h-[120px] resize-none py-3`}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
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
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Hora
          </span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
          Lugar
        </span>
        <input
          value={locationLabel}
          onChange={(e) => setLocationLabel(e.target.value)}
          placeholder="Ej. Clubhouse"
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="text-[14px] font-medium text-[var(--color-action-destructive)]">
          {error}
        </p>
      ) : null}
      <ScreenPrimaryAction
        label={submitting ? "Publicando…" : "Publicar evento"}
        onClick={() => void onSubmit()}
        disabled={submitting}
      />
    </MobileScreen>
  );
}
