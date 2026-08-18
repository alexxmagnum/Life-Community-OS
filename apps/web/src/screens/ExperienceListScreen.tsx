"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatExperienceWhen,
  spotsLeft,
  type Experience,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  ExperienceCard,
  FilterChipRow,
  LoadingState,
  MobileScreen,
  ScreenHeader,
  ScreenPrimaryAction,
  ScreenSearch,
} from "@life-community-os/ui";
import { useCatalogDomain } from "@/providers/CatalogProvider";
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

function matchesChip(experience: Experience, chip: string): boolean {
  if (chip === "all") return true;
  if (chip === "week") {
    const start = new Date(experience.startsAt).getTime();
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return start >= now - 60_000 && start <= now + weekMs;
  }
  const hay =
    `${experience.title} ${experience.description} ${experience.location}`.toLowerCase();
  if (chip === "outdoor") {
    return /paseo|exterior|aire libre|camino|golf|naturaleza|campo|outdoor|atardecer/.test(
      hay,
    );
  }
  if (chip === "wellness") {
    return /estiramiento|bienestar|yoga|stretch|medit|relax|wellness|salud|cuerpo/.test(
      hay,
    );
  }
  return true;
}

function ExperienceListBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const savedOnly = searchParams.get("saved") === "1";
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState, savedExperiences, isSaved } =
    useExperienceParticipation();
  const { items: catalogExperiences, ready: catalogReady } =
    useCatalogDomain<Experience>("experiences");
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("all");

  const items = useMemo(() => {
    const source = savedOnly ? savedExperiences : catalogExperiences;
    return source.filter((e) => {
      if (!matchesChip(e, chip)) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q) ||
        (e.areaLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, chip, savedOnly, savedExperiences, catalogExperiences]);

  if (!isFeatureEnabled("experiences")) {
    return (
      <EmptyState
        title="Las experiencias no están disponibles"
        description="Esta comunidad aún no ha activado las experiencias."
      />
    );
  }

  if (!hasCapability(CAPABILITIES.experienceView)) {
    return (
      <EmptyState
        title="Sin acceso"
        description="Las experiencias no están disponibles para tu cuenta ahora mismo."
      />
    );
  }

  if (!catalogReady && !savedOnly) {
    return <LoadingState label="Cargando experiencias…" />;
  }

  const canCreate = hasCapability(CAPABILITIES.experienceCreate);

  return (
    <MobileScreen>
      <ScreenHeader
        title={savedOnly ? "Guardadas" : "Experiencias"}
        subtitle={
          savedOnly
            ? "Experiencias que has marcado para volver."
            : "Encuentra algo en lo que participar cerca de ti."
        }
      />

      {savedOnly ? (
        <button
          type="button"
          onClick={() => router.push("/experiences")}
          className="text-left text-[14px] font-semibold text-[var(--color-action-primary)]"
        >
          ← Ver todas
        </button>
      ) : null}

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar paseos, clases, encuentros…"
        label="Buscar experiencias"
      />

      {!savedOnly ? (
        <FilterChipRow
          items={[
            { id: "all", label: "Todas" },
            { id: "week", label: "Esta semana" },
            { id: "outdoor", label: "Exterior" },
            { id: "wellness", label: "Bienestar" },
          ]}
          activeId={chip}
          onChange={setChip}
        />
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title={savedOnly ? "Nada guardado todavía" : "Sin resultados"}
          description={
            savedOnly
              ? "Cuando guardes una experiencia, aparecerá aquí."
              : "Prueba otra búsqueda o filtro."
          }
          actionLabel={
            savedOnly
              ? "Ver experiencias"
              : query || chip !== "all"
                ? "Limpiar"
                : undefined
          }
          onAction={
            savedOnly
              ? () => router.push("/experiences")
              : query || chip !== "all"
                ? () => {
                    setQuery("");
                    setChip("all");
                  }
                : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
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
                meta={`${exp.participantCount} van · ${remaining} plazas${isSaved(exp.id) ? " · Guardada" : ""}`}
                imageUrl={exp.imageUrl}
                organizerName={exp.organizer.name}
                statusLabel={statusLabelFor(viewer, remaining)}
                ctaLabel="Ver"
                onClick={() => router.push(href)}
                onCta={() => router.push(href)}
              />
            );
          })}
        </div>
      )}

      {!savedOnly && canCreate ? (
        <ScreenPrimaryAction
          label="Proponer experiencia"
          onClick={() => router.push("/experiences/create")}
        />
      ) : null}
    </MobileScreen>
  );
}

export function ExperienceListScreen() {
  return (
    <Suspense fallback={<LoadingState label="Cargando…" />}>
      <ExperienceListBody />
    </Suspense>
  );
}
