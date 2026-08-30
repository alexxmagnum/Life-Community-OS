"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceWhen,
} from "@life-community-os/tenant-life-panoramica";
import {
  communityFeedItemHref,
  communityFeedPrimaryLabel,
  discoverExperienceQuery,
  discoverQueryFromActive,
  type CommunityFeedItem,
  type CommunityGroupRecord,
} from "@life-community-os/types";
import {
  ActivityCard,
  CommunityLifeSection,
  EmptyState,
  FlowScreenHeader,
  GroupCard,
  LocalLifeRail,
  LocalPlaceCard,
  MobileScreen,
  NeighbourTipCard,
  ScreenSearch,
} from "@life-community-os/ui";
import {
  locationFichaHref,
  resolvePlaceHref,
  useTenantLocations,
} from "@/lib/location";
import { fetchBusinesses } from "@/lib/business/business-client";
import { fetchHelpRequests } from "@/lib/marketplace/commerce-client";
import { fetchCommunityFeed } from "@/lib/community/community-client";
import type { BusinessProfile, HelpRequest } from "@life-community-os/types";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

/**
 * Descubrir = explore life around you.
 * Territory Access ranks local relevance (D.0.7.2.3).
 */
export function DiscoverScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    hasCapability,
    configuration,
    homeMode,
  } = useTenant();
  const { context: activeTerritory } = useTerritory();
  const discoverQuery = discoverQueryFromActive(activeTerritory);
  const experienceQuery = discoverExperienceQuery({
    tenantId: configuration.tenantId,
    territoryId: discoverQuery.territoryId,
  });
  const { allLocations } = useTenantLocations(
    configuration.tenantId,
    discoverQuery.territoryId,
  );
  const [query, setQuery] = useState("");

  const [neighbourTips, setNeighbourTips] = useState<HelpRequest[]>([]);
  const [trustedHelp, setTrustedHelp] = useState<BusinessProfile[]>([]);
  const [persistedGroups, setPersistedGroups] = useState<CommunityGroupRecord[]>([]);
  const [feedItems, setFeedItems] = useState<CommunityFeedItem[]>([]);

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const community = await fetchCommunityFeed(configuration.tenantId, {
        territoryId: experienceQuery?.territoryId ?? discoverQuery.territoryId,
      });
      if (!cancelled) {
        setPersistedGroups((community.groups as CommunityGroupRecord[]) ?? []);
        setFeedItems(community.items ?? []);
      }
      if (!canLocal) {
        if (!cancelled) {
          setNeighbourTips([]);
          setTrustedHelp([]);
        }
        return;
      }
      if (isFeatureEnabled("recommendations")) {
        const rows = await fetchHelpRequests({
          tenantId: configuration.tenantId,
          territoryId: discoverQuery.territoryId,
          type: "offer_help",
          board: "help",
        });
        if (!cancelled) {
          const q = query.trim().toLowerCase();
          setNeighbourTips(
            rows.filter((item) => {
              if (!q) return true;
              return (
                item.title.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
              );
            }),
          );
        }
      } else {
        setNeighbourTips([]);
      }
      if (isFeatureEnabled("services")) {
        const rows = await fetchBusinesses({
          tenantId: configuration.tenantId,
          territoryId: discoverQuery.territoryId,
          status: "published",
        });
        if (!cancelled) {
          const q = query.trim().toLowerCase();
          setTrustedHelp(
            rows.filter((item) => {
              if (!q) return true;
              return (
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
              );
            }),
          );
        }
      } else {
        setTrustedHelp([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    canLocal,
    isFeatureEnabled,
    configuration.tenantId,
    query,
    discoverQuery.territoryId,
    experienceQuery?.territoryId,
  ]);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    const q = query.trim().toLowerCase();
    // Location SoT for every tenant — LocalEntity is seed only.
    return allLocations
      .filter((loc) => {
        if (loc.visibility === "private") return false;
        if (!q) return true;
        return (
          loc.name.toLowerCase().includes(q) ||
          (loc.areaLabel ?? "").toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 12)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        categoryLabel: loc.category,
        areaLabel: loc.areaLabel ?? configuration.branding.name,
        story: loc.summary ?? "",
        imageUrl: loc.imageUrl,
        recommendedBy: undefined as string | undefined,
        verified: true,
        trustNote: undefined as string | undefined,
        href: `/map?focus=${encodeURIComponent(loc.id)}`,
      }));
  }, [
    canLocal,
    query,
    allLocations,
    configuration.branding.name,
  ]);

  const experiences = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feedItems.filter((item) => {
      if (
        item.type !== "experience" &&
        item.type !== "event" &&
        item.type !== "resource_activity" &&
        item.type !== "reservation"
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.metadata?.locationLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, feedItems]);

  const groups = useMemo(() => {
    if (!isFeatureEnabled("groups")) return [];
    if (homeMode !== "premium") return [];
    const q = query.trim().toLowerCase();
    return persistedGroups.filter((g) => {
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    });
  }, [query, isFeatureEnabled, homeMode, persistedGroups]);

  const hasPlans = experiences.length > 0 || groups.length > 0;
  const hasAnything =
    nearYou.length > 0 ||
    neighbourTips.length > 0 ||
    hasPlans ||
    trustedHelp.length > 0;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Descubrir"
        subtitle="Explora la vida a tu alrededor."
        onBack={() => router.push("/")}
        onExit={() => router.push("/community")}
      />

      <ScreenSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar experiencias, sitios, ayuda…"
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
          actionLabel={
            query ? "Limpiar búsqueda" : "Ver el mapa"
          }
          onAction={
            query ? () => setQuery("") : () => router.push("/map")
          }
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
                    imageUrl={place.imageUrl ?? ""}
                    recommendedBy={place.recommendedBy}
                    verified={place.verified}
                    trustNote={place.trustNote}
                    onClick={() =>
                      router.push(
                        place.href ??
                          resolvePlaceHref({
                            entityOrLocationId: place.id,
                            tenantId: configuration.tenantId,
                          }),
                      )
                    }
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
                    quote={tip.description}
                    author={tip.authorDisplayName}
                    relatedLabel={tip.category}
                  />
                ))}
              </div>
            </CommunityLifeSection>
          ) : null}

          {hasPlans ? (
            <CommunityLifeSection
              title="Experiencias y actividades"
              subtitle="Lo que está pasando y grupos abiertos."
            >
              <div className="space-y-4">
                {experiences.map((item) => {
                  return (
                    <ActivityCard
                      key={item.id}
                      title={item.title}
                      when={
                        item.startsAt
                          ? formatExperienceWhen(item.startsAt)
                          : communityFeedPrimaryLabel(item)
                      }
                      where={
                        item.metadata?.locationLabel || item.description || ""
                      }
                      peopleLabel={
                        item.capacity
                          ? `${item.capacity.available} plazas disponibles`
                          : undefined
                      }
                      imageUrl={item.metadata?.imageUrl ?? ""}
                      ctaLabel={communityFeedPrimaryLabel(item)}
                      onClick={() => router.push(communityFeedItemHref(item))}
                      onCta={() => router.push(communityFeedItemHref(item))}
                    />
                  );
                })}
                {groups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {groups.map((g) => (
                      <GroupCard
                        key={g.id}
                        name={g.name}
                        members={0}
                        imageUrl={g.imageUrl ?? ""}
                        onOpen={() =>
                          router.push(`/community/groups/${g.id}/conversation`)
                        }
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
                    categoryLabel={place.category}
                    areaLabel={configuration.branding.name}
                    blurb={place.description}
                    imageUrl={place.imageUrl ?? ""}
                    onClick={() =>
                      router.push(locationFichaHref(place.locationId))
                    }
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
