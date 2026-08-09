"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  listDiscoverableExperiences,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  ExperienceCard,
  FilterChipRow,
  FlowScreenHeader,
  MobileScreen,
  ScreenSearch,
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
  const [chip, setChip] = useState("all");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  const items = useMemo(() => {
    return listDiscoverableExperiences({
      includeSessionCreated: sessionReady,
    }).filter((e) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.areaLabel.toLowerCase().includes(q)
      );
    });
  }, [query, sessionReady]);

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

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Experiencias"
        subtitle="Encuentra algo en lo que participar cerca de ti."
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar paseos, clases, encuentros…"
        label="Buscar experiencias"
      />

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

      {items.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba otra búsqueda o vuelve más tarde."
          actionLabel="Limpiar búsqueda"
          onAction={() => setQuery("")}
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
                meta={`${exp.participantCount} van · ${remaining} plazas`}
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
    </MobileScreen>
  );
}
