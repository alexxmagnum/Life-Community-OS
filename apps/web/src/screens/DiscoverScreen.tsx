"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
  listDiscoverableExperiences,
  listGroups,
  listNearYou,
  listNeighbourRecommendations,
  listTrustedHelp,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  ActivityCard,
  CommunityLifeSection,
  EmptyState,
  GroupCard,
  LocalLifeRail,
  LocalPlaceCard,
  MobileScreen,
  NeighbourTipCard,
  ScreenHeader,
  ScreenSearch,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";

/**
 * Descubrir = explore life around you.
 * Local life ecosystem via platform Local Entity / Discovery.
 * No entity-module menus — situations and trust signals only.
 */
export function DiscoverScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const { getViewerState } = useExperienceParticipation();
  const [query, setQuery] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listNearYou(query);
  }, [canLocal, query]);

  const neighbourTips = useMemo(() => {
    if (!canLocal || !isFeatureEnabled("recommendations")) return [];
    return listNeighbourRecommendations(query);
  }, [canLocal, isFeatureEnabled, query]);

  const experiences = useMemo(() => {
    if (!isFeatureEnabled("experiences")) return [];
    if (!hasCapability(CAPABILITIES.experienceView)) return [];
    const q = query.trim().toLowerCase();
    return listDiscoverableExperiences({
      includeSessionCreated: sessionReady,
    }).filter((e) => {
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.areaLabel.toLowerCase().includes(q)
      );
    });
  }, [query, isFeatureEnabled, hasCapability, sessionReady]);

  const groups = useMemo(() => {
    if (!isFeatureEnabled("groups")) return [];
    const q = query.trim().toLowerCase();
    return listGroups().filter((g) => {
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    });
  }, [query, isFeatureEnabled]);

  const trustedHelp = useMemo(() => {
    if (!canLocal || !isFeatureEnabled("services")) return [];
    return listTrustedHelp(query);
  }, [canLocal, isFeatureEnabled, query]);

  const hasPlans = experiences.length > 0 || groups.length > 0;
  const hasAnything =
    nearYou.length > 0 ||
    neighbourTips.length > 0 ||
    hasPlans ||
    trustedHelp.length > 0;

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Descubrir"
        subtitle="Explora la vida a tu alrededor."
      />

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar planes, sitios, ayuda…"
        label="Buscar"
      />

      {!hasAnything ? (
        <EmptyState
          title={query ? "Sin resultados" : "Nada cerca todavía"}
          description={
            query
              ? "Prueba con otras palabras."
              : "Cuando haya vida local, la verás aquí."
          }
          actionLabel={query ? "Limpiar búsqueda" : undefined}
          onAction={query ? () => setQuery("") : undefined}
        />
      ) : (
        <div className="space-y-10">
          {nearYou.length > 0 ? (
            <CommunityLifeSection
              title="Cerca de ti"
              subtitle="Restaurantes, cafés, tiendas y sitios del barrio."
            >
              <LocalLifeRail>
                {nearYou.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.categoryLabel}
                    areaLabel={place.areaLabel}
                    blurb={place.story}
                    imageUrl={place.imageUrl}
                    recommendedBy={place.recommendedBy}
                    verified={place.verified}
                    trustNote={place.trustNote}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}

          {neighbourTips.length > 0 ? (
            <CommunityLifeSection
              title="Recomendado por vecinos"
              subtitle="Consejos y opiniones de gente en la que puedes confiar."
            >
              <div className="space-y-3">
                {neighbourTips.map((tip) => (
                  <NeighbourTipCard
                    key={tip.id}
                    quote={tip.body}
                    author={tip.authorName}
                    relatedLabel={tip.relatedLabel}
                    imageUrl={tip.imageUrl}
                  />
                ))}
              </div>
            </CommunityLifeSection>
          ) : null}

          {hasPlans ? (
            <CommunityLifeSection
              title="Planes y actividades"
              subtitle="Lo que está pasando y grupos abiertos."
            >
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
                      ctaLabel={viewer === "joined" ? "Ver plan" : "Apuntarme"}
                      onClick={() => router.push(`/experiences/${exp.id}`)}
                      onCta={() => router.push(`/experiences/${exp.id}`)}
                    />
                  );
                })}
                {groups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {groups.map((g) => (
                      <GroupCard
                        key={g.id}
                        name={g.name}
                        members={g.memberCount}
                        imageUrl={g.imageUrl}
                        onOpen={() => router.push(`/community/groups/${g.id}`)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </CommunityLifeSection>
          ) : null}

          {trustedHelp.length > 0 ? (
            <CommunityLifeSection
              title="Ayuda de confianza"
              subtitle="Profesionales y negocios locales recomendados."
            >
              <LocalLifeRail>
                {trustedHelp.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.categoryLabel}
                    areaLabel={place.areaLabel}
                    blurb={place.story}
                    imageUrl={place.imageUrl}
                    recommendedBy={place.recommendedBy}
                    verified={place.verified}
                    trustNote={place.trustNote}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}
        </div>
      )}
    </MobileScreen>
  );
}
