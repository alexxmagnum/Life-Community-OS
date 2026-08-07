"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatExperienceWhen,
  listDiscoverableExperiences,
  listGroups,
  listLeisurePlaces,
  listLocalPlaces,
  listLocalServices,
  listRestaurants,
  listResources,
  recommendations,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  ActivityCard,
  EmptyState,
  GroupCard,
  LocalPlaceCard,
  RecommendationCard,
  ResourceDiscoveryCard,
  cn,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

type Segment =
  | "actividades"
  | "ocio"
  | "restaurantes"
  | "lugares"
  | "servicios"
  | "recomendaciones"
  | "grupos";

export function DiscoverScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState } = useExperienceParticipation();

  const segments = useMemo(() => {
    const list: { id: Segment; label: string }[] = [];
    if (isFeatureEnabled("experiences")) {
      list.push({ id: "actividades", label: "Actividades" });
    }
    list.push({ id: "ocio", label: "Ocio" });
    list.push({ id: "restaurantes", label: "Restaurantes" });
    if (isFeatureEnabled("resources")) {
      list.push({ id: "lugares", label: "Lugares" });
    }
    if (isFeatureEnabled("services")) {
      list.push({ id: "servicios", label: "Servicios" });
    }
    if (isFeatureEnabled("recommendations")) {
      list.push({ id: "recomendaciones", label: "Recomendaciones" });
    }
    if (isFeatureEnabled("groups")) {
      list.push({ id: "grupos", label: "Grupos" });
    }
    return list;
  }, [isFeatureEnabled]);

  const initialParam = searchParams.get("segment");
  const legacyMap: Record<string, Segment> = {
    experiences: "actividades",
    services: "servicios",
    places: "lugares",
  };
  const mappedInitial =
    (legacyMap[initialParam ?? ""] as Segment | undefined) ??
    (initialParam as Segment | null);

  const [segment, setSegment] = useState<Segment>(
    mappedInitial && segments.some((s) => s.id === mappedInitial)
      ? mappedInitial
      : segments[0]?.id ?? "actividades",
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    const raw = searchParams.get("segment");
    const next =
      (legacyMap[raw ?? ""] as Segment | undefined) ?? (raw as Segment | null);
    if (next && segments.some((s) => s.id === next)) {
      setSegment(next);
    }
  }, [searchParams, segments]);

  const active = segments.some((s) => s.id === segment)
    ? segment
    : segments[0]?.id;

  if (!active) {
    return (
      <EmptyState
        title="Nada que descubrir aún"
        description="Esta comunidad todavía no ha activado el descubrimiento."
      />
    );
  }

  const q = query.trim().toLowerCase();
  const match = (text: string) => !q || text.toLowerCase().includes(q);

  const experiences = listDiscoverableExperiences().filter(
    (e) => match(e.title) || match(e.location) || match(e.areaLabel),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-8">
          Descubrir
        </h1>
        <p className="mt-2 text-[16px] text-[var(--color-text-secondary)]">
          Hay vida aquí — ocio, sitios, servicios y planes.
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Buscar</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar actividades, sitios, servicios…"
          className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {segments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSegment(s.id);
              router.replace(`/discover?segment=${s.id}`);
            }}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full px-4 text-[14px] font-semibold",
              active === s.id
                ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {active === "actividades" ? (
        !hasCapability(CAPABILITIES.experienceView) ? (
          <EmptyState
            title="Sin acceso"
            description="Las actividades no están disponibles para tu cuenta."
          />
        ) : experiences.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="Prueba otra búsqueda."
            actionLabel="Limpiar"
            onAction={() => setQuery("")}
          />
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => {
              const viewer = getViewerState(exp);
              const remaining = spotsLeft(exp);
              return (
                <ActivityCard
                  key={exp.id}
                  title={exp.title}
                  when={formatExperienceWhen(exp.startsAt)}
                  where={exp.location}
                  peopleLabel={
                    viewer === "joined"
                      ? "Vas a ir"
                      : `${exp.participantCount} van · ${remaining} plazas`
                  }
                  imageUrl={exp.imageUrl}
                  ctaLabel={viewer === "joined" ? "Ver" : "Participar"}
                  onClick={() => router.push(`/experiences/${exp.id}`)}
                  onCta={() => router.push(`/experiences/${exp.id}`)}
                />
              );
            })}
          </div>
        )
      ) : null}

      {active === "ocio" ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {listLeisurePlaces()
            .concat(listLocalPlaces("spot"))
            .filter((p) => match(p.name) || match(p.blurb))
            .map((place) => (
              <LocalPlaceCard
                key={place.id}
                name={place.name}
                categoryLabel={place.categoryLabel}
                areaLabel={place.areaLabel}
                blurb={place.blurb}
                imageUrl={place.imageUrl}
                recommendedBy={place.recommendedBy}
              />
            ))}
        </div>
      ) : null}

      {active === "restaurantes" ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {listRestaurants()
            .filter((p) => match(p.name) || match(p.blurb))
            .map((place) => (
              <LocalPlaceCard
                key={place.id}
                name={place.name}
                categoryLabel={place.categoryLabel}
                areaLabel={place.areaLabel}
                blurb={place.blurb}
                imageUrl={place.imageUrl}
                recommendedBy={place.recommendedBy}
              />
            ))}
        </div>
      ) : null}

      {active === "lugares" ? (
        !hasCapability(CAPABILITIES.resourceView) ? (
          <EmptyState
            title="Sin acceso"
            description="Los espacios compartidos no están disponibles para tu cuenta."
          />
        ) : (
          <div className="space-y-4">
            {listResources()
              .filter((r) => match(r.name) || match(r.areaLabel))
              .map((resource) => (
                <ResourceDiscoveryCard
                  key={resource.id}
                  name={resource.name}
                  description={resource.description}
                  availability={resource.availabilityPreview}
                  area={resource.areaLabel}
                  imageUrl={resource.imageUrl}
                  onClick={() => router.push(`/resources/${resource.id}`)}
                  onReserve={
                    hasCapability(CAPABILITIES.resourceReserve)
                      ? () =>
                          router.push(
                            `/resources/${resource.id}/availability`,
                          )
                      : undefined
                  }
                />
              ))}
          </div>
        )
      ) : null}

      {active === "servicios" ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {listLocalServices()
            .filter((p) => match(p.name) || match(p.blurb))
            .map((place) => (
              <LocalPlaceCard
                key={place.id}
                name={place.name}
                categoryLabel={place.categoryLabel}
                areaLabel={place.areaLabel}
                blurb={place.blurb}
                imageUrl={place.imageUrl}
                recommendedBy={place.recommendedBy}
                verified={place.verified}
              />
            ))}
        </div>
      ) : null}

      {active === "recomendaciones" ? (
        <div className="space-y-3">
          {recommendations.map((tip) => (
            <RecommendationCard
              key={tip.id}
              quote={tip.quote}
              author={tip.author}
              imageUrl={tip.imageUrl}
              className="w-full min-w-0"
            />
          ))}
        </div>
      ) : null}

      {active === "grupos" ? (
        <div className="grid grid-cols-2 gap-3">
          {listGroups()
            .filter((g) => match(g.name) || match(g.description))
            .map((g) => (
              <GroupCard
                key={g.id}
                name={g.name}
                members={g.memberCount}
                imageUrl={g.imageUrl}
                onOpen={() => router.push("/community?tab=groups")}
              />
            ))}
        </div>
      ) : null}
    </div>
  );
}
