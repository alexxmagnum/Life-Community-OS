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
  FilterChipRow,
  GroupCard,
  LocalPlaceCard,
  MobileScreen,
  RecommendationCard,
  ResourceDiscoveryCard,
  ScreenHeader,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

/** Human intentions — never expose Experience / Resource / Recommendation as nav. */
type Intent = "hacer" | "ir" | "encontrar";

const INTENT_CHIPS: { id: Intent; label: string }[] = [
  { id: "hacer", label: "Hacer" },
  { id: "ir", label: "Ir" },
  { id: "encontrar", label: "Encontrar" },
];

/** Map legacy entity segments → human intent (deep links stay usable). */
function resolveIntent(raw: string | null): Intent | null {
  if (!raw) return null;
  if (raw === "hacer" || raw === "ir" || raw === "encontrar") return raw;
  const legacy: Record<string, Intent> = {
    experiencias: "hacer",
    experiences: "hacer",
    actividades: "hacer",
    grupos: "hacer",
    groups: "hacer",
    ocio: "ir",
    restaurantes: "ir",
    lugares: "ir",
    places: "ir",
    facilities: "ir",
    servicios: "encontrar",
    services: "encontrar",
    recomendaciones: "encontrar",
    recommendations: "encontrar",
  };
  return legacy[raw] ?? null;
}

export function DiscoverScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState } = useExperienceParticipation();

  const paramIntent = resolveIntent(
    searchParams.get("intent") ?? searchParams.get("segment"),
  );
  const [intent, setIntent] = useState<Intent>(paramIntent ?? "hacer");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const next = resolveIntent(
      searchParams.get("intent") ?? searchParams.get("segment"),
    );
    if (next) setIntent(next);
  }, [searchParams]);

  const q = query.trim().toLowerCase();
  const match = (text: string) => !q || text.toLowerCase().includes(q);

  const experiences = useMemo(
    () =>
      listDiscoverableExperiences().filter(
        (e) => match(e.title) || match(e.location) || match(e.areaLabel),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- match depends on q
    [q],
  );

  const groups = useMemo(
    () =>
      listGroups().filter((g) => match(g.name) || match(g.description)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );

  const goPlaces = useMemo(() => {
    const leisure = listLeisurePlaces().concat(listLocalPlaces("spot"));
    const restaurants = listRestaurants();
    const resources = isFeatureEnabled("resources") ? listResources() : [];
    return {
      leisure: leisure.filter((p) => match(p.name) || match(p.blurb)),
      restaurants: restaurants.filter((p) => match(p.name) || match(p.blurb)),
      resources: resources.filter((r) => match(r.name) || match(r.areaLabel)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, isFeatureEnabled]);

  const findItems = useMemo(() => {
    const services = isFeatureEnabled("services")
      ? listLocalServices().filter((p) => match(p.name) || match(p.blurb))
      : [];
    const tips = isFeatureEnabled("recommendations")
      ? recommendations.filter(
          (t) => match(t.quote) || match(t.author),
        )
      : [];
    return { services, tips };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, isFeatureEnabled]);

  const selectIntent = (id: Intent) => {
    setIntent(id);
    router.replace(`/discover?intent=${id}`);
  };

  const subtitle =
    intent === "hacer"
      ? "Planes, deporte, encuentros y grupos abiertos."
      : intent === "ir"
        ? "Sitios, restaurantes y espacios de la comunidad."
        : "Servicios, profesionales y saber de vecinos.";

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Descubrir"
        subtitle="¿Qué quieres hacer?"
      />

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar planes, sitios, ayuda…"
        label="Buscar en Descubrir"
      />

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-[var(--color-text-tertiary)]">
          Elige una intención
        </p>
        <FilterChipRow
          items={INTENT_CHIPS}
          activeId={intent}
          onChange={(id) => selectIntent(id as Intent)}
        />
        <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
          {subtitle}
        </p>
      </div>

      {intent === "hacer" ? (
        <div className="space-y-8">
          {isFeatureEnabled("experiences") ? (
            <section className="space-y-4">
              {!hasCapability(CAPABILITIES.experienceView) ? (
                <EmptyState
                  title="Sin acceso"
                  description="Los planes no están disponibles para tu cuenta."
                />
              ) : experiences.length === 0 ? (
                <EmptyState
                  title="Nada que hacer ahora"
                  description="Prueba otra búsqueda o vuelve más tarde."
                  actionLabel="Limpiar"
                  onAction={() => setQuery("")}
                />
              ) : (
                experiences.map((exp) => {
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
                })
              )}
            </section>
          ) : null}

          {isFeatureEnabled("groups") && groups.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                Grupos abiertos
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    name={g.name}
                    members={g.memberCount}
                    imageUrl={g.imageUrl}
                    onOpen={() => router.push("/community?tab=grupos")}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {!isFeatureEnabled("experiences") &&
          !(isFeatureEnabled("groups") && groups.length > 0) ? (
            <EmptyState
              title="Nada que descubrir aún"
              description="Esta comunidad todavía no ha activado planes ni grupos."
            />
          ) : null}
        </div>
      ) : null}

      {intent === "ir" ? (
        <div className="space-y-8">
          {goPlaces.restaurants.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                Dónde comer
              </h2>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {goPlaces.restaurants.map((place) => (
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
            </section>
          ) : null}

          {goPlaces.leisure.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                Sitios cercanos
              </h2>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {goPlaces.leisure.map((place) => (
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
            </section>
          ) : null}

          {isFeatureEnabled("resources") ? (
            <section className="space-y-4">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                Espacios compartidos
              </h2>
              {!hasCapability(CAPABILITIES.resourceView) ? (
                <EmptyState
                  title="Sin acceso"
                  description="Los espacios compartidos no están disponibles para tu cuenta."
                />
              ) : goPlaces.resources.length === 0 ? (
                <EmptyState
                  title="Sin resultados"
                  description="Prueba otra búsqueda."
                />
              ) : (
                goPlaces.resources.map((resource) => (
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
                ))
              )}
            </section>
          ) : null}

          {goPlaces.restaurants.length === 0 &&
          goPlaces.leisure.length === 0 &&
          (!isFeatureEnabled("resources") ||
            goPlaces.resources.length === 0) ? (
            <EmptyState
              title="Nada que visitar aún"
              description="Cuando haya sitios cerca, los verás aquí."
            />
          ) : null}
        </div>
      ) : null}

      {intent === "encontrar" ? (
        <div className="space-y-8">
          {findItems.services.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                Ayuda cerca
              </h2>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {findItems.services.map((place) => (
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
            </section>
          ) : null}

          {findItems.tips.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)]">
                Lo que recomiendan los vecinos
              </h2>
              <div className="space-y-3">
                {findItems.tips.map((tip) => (
                  <RecommendationCard
                    key={tip.id}
                    quote={tip.quote}
                    author={tip.author}
                    imageUrl={tip.imageUrl}
                    className="w-full min-w-0"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {findItems.services.length === 0 && findItems.tips.length === 0 ? (
            <EmptyState
              title="Nada que encontrar aún"
              description="Servicios y consejos de vecinos aparecerán aquí."
            />
          ) : null}
        </div>
      ) : null}
    </MobileScreen>
  );
}
