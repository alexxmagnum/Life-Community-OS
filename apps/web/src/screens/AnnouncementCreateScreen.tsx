"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  COMMUNITY_ANNOUNCEMENT_AUDIENCES,
  COMMUNITY_ANNOUNCEMENT_CATEGORIES,
  COMMUNITY_ANNOUNCEMENT_PRIORITIES,
  communityAnnouncementCategoryLabel,
  type CommunityAnnouncementAudience,
  type CommunityAnnouncementCategory,
  type CommunityAnnouncementPriority,
} from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
  ScreenPrimaryAction,
} from "@life-community-os/ui";
import { createTerritoryAnnouncementRequest } from "@/lib/community/community-operations-client";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

const STEPS = [
  "¿Qué quieres avisar?",
  "¿A quién afecta?",
  "Detalles",
  "Fecha / duración",
  "Publicar",
] as const;

const MEMBER_CATEGORIES = COMMUNITY_ANNOUNCEMENT_CATEGORIES.filter(
  (item) => item !== "official" && item !== "emergency",
);

function audienceLabel(audience: CommunityAnnouncementAudience): string {
  switch (audience) {
    case "territory":
      return "Toda la comunidad";
    case "zone":
      return "Residentes de una zona";
    case "place":
      return "Usuarios de un lugar";
    case "group":
      return "Grupo";
  }
}

function priorityLabel(priority: CommunityAnnouncementPriority): string {
  switch (priority) {
    case "normal":
      return "Normal";
    case "important":
      return "Importante";
    case "urgent":
      return "Urgente";
  }
}

export function AnnouncementCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasCapability, configuration, authenticated, hasMembership } =
    useTenant();
  const locationId = searchParams.get("locationId")?.trim() ?? "";
  const locationName = searchParams.get("locationName")?.trim() ?? "";

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<CommunityAnnouncementCategory>("community");
  const [priority, setPriority] =
    useState<CommunityAnnouncementPriority>("normal");
  const [audience, setAudience] =
    useState<CommunityAnnouncementAudience>(
      locationId ? "place" : "territory",
    );
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = hasCapability(CAPABILITIES.contentCreate);
  const isAdmin = hasCapability(CAPABILITIES.announcementPublishOfficial);
  const categories = useMemo(
    () => (isAdmin ? [...COMMUNITY_ANNOUNCEMENT_CATEGORIES] : MEMBER_CATEGORIES),
    [isAdmin],
  );

  const fieldClass =
    "min-h-[48px] w-full rounded-[14px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3.5 text-[15px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action-primary)]";

  if (!authenticated || !hasMembership) {
    return (
      <EmptyState
        title="Únete para crear avisos"
        description="Comparte información importante con tu comunidad cuando formes parte de ella."
        actionLabel="Ir a mi perfil"
        onAction={() => router.push("/me")}
      />
    );
  }

  if (!canCreate) {
    return (
      <EmptyState
        title="Sin permiso para crear avisos"
        description="Tu cuenta no puede crear avisos comunitarios ahora mismo."
        actionLabel="Volver a comunidad"
        onAction={() => router.push("/community")}
      />
    );
  }

  const goNext = () => {
    setError(null);
    if (step === 0 && !title.trim()) {
      setError("Escribe un título para el aviso.");
      return;
    }
    if (step === 2 && !description.trim()) {
      setError("Añade los detalles del aviso.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const onPublish = async () => {
    setError(null);
    setSubmitting(true);
    const result = await createTerritoryAnnouncementRequest({
      tenantId: configuration.tenantId,
      title: title.trim(),
      body: description.trim(),
      category,
      priority,
      audience,
      locationId: audience === "place" ? locationId || undefined : undefined,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      requiresAcknowledgement,
    });
    setSubmitting(false);
    if ("error" in result) {
      setError("No se pudo publicar el aviso. Inténtalo de nuevo.");
      return;
    }
    router.push(`/community/content/${result.id}`);
  };

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Crear aviso"
        subtitle="Comparte información importante con tu comunidad"
        onBack={() => (step > 0 ? setStep(step - 1) : router.push("/community"))}
        onExit={() => router.push("/community")}
      />

      <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
        Paso {step + 1} de {STEPS.length} · {STEPS[step]}
      </p>

      {step === 0 ? (
        <div className="space-y-3">
          <label className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
            Título del aviso
          </label>
          <input
            className={fieldClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Piscina cerrada por mantenimiento"
          />
          <label className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
            Tipo
          </label>
          <select
            className={fieldClass}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as CommunityAnnouncementCategory)
            }
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {communityAnnouncementCategoryLabel(item)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-2">
          {COMMUNITY_ANNOUNCEMENT_AUDIENCES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setAudience(item)}
              className={
                audience === item
                  ? "ui-press w-full rounded-[16px] bg-[var(--color-action-primary-subtle)] px-4 py-3 text-left ring-2 ring-[var(--color-action-primary)]"
                  : "ui-press w-full rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3 text-left shadow-[var(--shadow-elev-1)]"
              }
            >
              <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
                {audienceLabel(item)}
              </span>
              {item === "place" && locationName ? (
                <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">
                  {locationName}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <label className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
            Detalles
          </label>
          <textarea
            className={`${fieldClass} min-h-[140px] py-3`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explica qué ocurre, cuándo y qué deben hacer las personas."
          />
          <label className="flex items-center gap-2 text-[14px] text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={requiresAcknowledgement}
              onChange={(event) =>
                setRequiresAcknowledgement(event.target.checked)
              }
            />
            Pedir confirmación de lectura
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <label className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
            Prioridad
          </label>
          <select
            className={fieldClass}
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as CommunityAnnouncementPriority)
            }
          >
            {COMMUNITY_ANNOUNCEMENT_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {priorityLabel(item)}
              </option>
            ))}
          </select>
          <label className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
            Empieza (opcional)
          </label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <label className="block text-[14px] font-medium text-[var(--color-text-secondary)]">
            Termina (opcional)
          </label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Confirmación
          </p>
          <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">
            {title}
          </p>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            {communityAnnouncementCategoryLabel(category)} ·{" "}
            {audienceLabel(audience)} · {priorityLabel(priority)}
          </p>
          <p className="text-[14px] leading-snug text-[var(--color-text-secondary)]">
            {description}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-[14px] text-[var(--color-text-danger,#c0392b)]">
          {error}
        </p>
      ) : null}

      {step < STEPS.length - 1 ? (
        <ScreenPrimaryAction label="Continuar" onClick={goNext} />
      ) : (
        <ScreenPrimaryAction
          label={submitting ? "Publicando…" : "Publicar aviso"}
          onClick={() => void onPublish()}
        />
      )}
    </MobileScreen>
  );
}
