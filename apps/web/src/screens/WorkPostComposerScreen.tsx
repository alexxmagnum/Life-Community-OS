"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { workPostTypeLabel, WORK_POST_CATEGORIES } from "@life-community-os/tenant-life-panoramica";
import type { WorkPostCategory, WorkPostType } from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createHelpRequestRequest } from "@/lib/marketplace/commerce-client";
import { useTenant } from "@/providers/TenantProvider";

function isWorkPostType(value: string | null): value is WorkPostType {
  return value === "looking_for_work" || value === "offering_work";
}

/**
 * Community work board composer — Busco / Ofrezco trabajo.
 * Demo session storage only (no backend persistence).
 */
export function WorkPostComposerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, isModuleEnabled, configuration } = useTenant();

  const initialType = searchParams.get("type");
  const [type, setType] = useState<WorkPostType | null>(
    isWorkPostType(initialType) ? initialType : null,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<WorkPostCategory>("other");
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState(configuration.branding.name || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const typeLabel = useMemo(
    () => (type ? workPostTypeLabel(type) : null),
    [type],
  );

  const workEnabled =
    isModuleEnabled("services") &&
    (isFeatureEnabled("work") || isFeatureEnabled("services"));

  if (!workEnabled) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Trabajo"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Trabajo no disponible"
          description="Este tablón no está activo en tu comunidad ahora mismo."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]";

  const onPublish = async () => {
    if (!type) return;
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      setError("Pon un título corto para el anuncio.");
      return;
    }
    if (!trimmedDescription) {
      setError("Cuenta un poco más: qué buscas o qué ofreces.");
      return;
    }

    setSubmitting(true);
    const created = await createHelpRequestRequest({
      tenantId: configuration.tenantId,
      type: type === "looking_for_work" ? "need_help" : "offer_help",
      title: trimmedTitle,
      description: [
        trimmedDescription,
        availability.trim() ? `Disponibilidad: ${availability.trim()}` : "",
        location.trim() ? `Zona: ${location.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      category,
    });
    if ("error" in created) {
      setError("No se pudo publicar el anuncio. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }
    router.push(`/services/work/${created.request.id}`);
  };

  if (!type) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Publicar en Trabajo"
          subtitle="Un anuncio sencillo entre vecinos. No es un portal de empleo."
          onBack={() => router.push("/services/work")}
          onExit={() => router.push("/services")}
        />

        <div className="mt-2 space-y-3">
          <button
            type="button"
            onClick={() => setType("looking_for_work")}
            className="flex w-full items-start gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
          >
            <span className="text-[22px]" aria-hidden>
              🔍
            </span>
            <span>
              <span className="block text-[17px] font-semibold text-[var(--color-text-primary)]">
                Busco trabajo
              </span>
              <span className="mt-1 block text-[14px] leading-snug text-[var(--color-text-secondary)]">
                Quiero trabajar cerca de casa — jardinería, clases, ayuda…
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setType("offering_work")}
            className="flex w-full items-start gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
          >
            <span className="text-[22px]" aria-hidden>
              📢
            </span>
            <span>
              <span className="block text-[17px] font-semibold text-[var(--color-text-primary)]">
                Ofrezco trabajo
              </span>
              <span className="mt-1 block text-[14px] leading-snug text-[var(--color-text-secondary)]">
                Necesito a alguien para una tarea o trabajo puntual
              </span>
            </span>
          </button>
        </div>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title={typeLabel ?? "Publicar anuncio"}
        subtitle={
          type === "looking_for_work"
            ? "Cuenta qué trabajo buscas y cuándo puedes."
            : "Cuenta qué trabajo ofreces y a quién necesitas."
        }
        onBack={() => {
          setType(null);
          setError(null);
        }}
        onExit={() => router.push("/services")}
      />

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Título
          </span>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "looking_for_work"
                ? "Ej. Trabajo de jardinería"
                : "Ej. Mantenimiento del jardín"
            }
            maxLength={80}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Categoría
          </span>
          <select
            className={fieldClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as WorkPostCategory)}
          >
            {WORK_POST_CATEGORIES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Descripción
          </span>
          <textarea
            className={`${fieldClass} min-h-[120px] resize-none py-3`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "looking_for_work"
                ? "Ej. Busco trabajo de jardinería unas horas a la semana."
                : "Ej. Necesito a alguien para el mantenimiento del jardín."
            }
            maxLength={500}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Disponibilidad
          </span>
          <input
            className={fieldClass}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Ej. Mañanas, fines de semana…"
            maxLength={80}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
            Zona
          </span>
          <input
            className={fieldClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej. Zona norte, Centro…"
            maxLength={80}
          />
        </label>

        {error ? (
          <p className="text-[14px] font-medium text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ScreenPrimaryAction
        label={submitting ? "Publicando…" : "Publicar anuncio"}
        onClick={() => void onPublish()}
        disabled={submitting}
      />
    </MobileScreen>
  );
}
