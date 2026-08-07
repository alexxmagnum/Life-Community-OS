"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  listDiscoverableExperiences,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  ExperienceCard,
  cn,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

function statusLabelFor(
  viewer: ReturnType<
    ReturnType<typeof useExperienceParticipation>["getViewerState"]
  >,
  remaining: number,
): string {
  if (viewer === "joined") return "Vas a ir";
  if (viewer === "full") return "Completo";
  if (viewer === "cancelled") return "Cancelado";
  if (viewer === "expired") return "Finalizado";
  if (remaining <= 3) return `${remaining} plazas`;
  return "Abierto";
}

export function ExperienceListScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState } = useExperienceParticipation();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    return listDiscoverableExperiences().filter((e) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.areaLabel.toLowerCase().includes(q)
      );
    });
  }, [query]);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las actividades no están disponibles"
        description="Esta comunidad aún no ha activado las actividades."
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="Las actividades no están disponibles para tu cuenta ahora mismo."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Descubrir
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8">
          Actividades
        </h1>
        <p className="mt-2 text-[16px] text-[var(--color-text-secondary)]">
          Encuentra algo en lo que participar en tu comunidad.
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Buscar actividades</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paseos, clases, encuentros…"
          className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Esta semana", "Exterior", "Bienestar"].map((chip) => (
          <span
            key={chip}
            className={cn(
              "rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)]",
            )}
          >
            {chip}
          </span>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba otra búsqueda o vuelve más tarde."
          actionLabel="Limpiar búsqueda"
          onAction={() => setQuery("")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((exp) => {
            const viewer = getViewerState(exp);
            const remaining = spotsLeft(exp);
            const href = `/experiences/${exp.id}`;
            return (
              <ExperienceCard
                key={exp.id}
                title={exp.title}
                when={formatExperienceWhen(exp.startsAt)}
                where={exp.location}
                meta={`${exp.participantCount} going · ${remaining} left`}
                imageUrl={exp.imageUrl}
                organizerName={exp.organizer.name}
                statusLabel={statusLabelFor(viewer, remaining)}
                ctaLabel={viewer === "joined" ? "Ver" : "Ver y participar"}
                onClick={() => router.push(href)}
                onCta={() => router.push(href)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
