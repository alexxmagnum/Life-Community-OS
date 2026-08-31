"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  discoverExperienceQuery,
  discoverQueryFromActive,
  isProfessionalBusiness,
  LIVING_EMPTY_CTA,
  LIVING_EMPTY_DESCRIPTION,
  LIVING_EMPTY_TITLE,
  partitionLivingCommunityFeed,
  sortLocalServiceCards,
  businessToLocalServiceCard,
  type CommunityFeedItem,
  type CommunityGroupRecord,
} from "@life-community-os/types";
import {
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
  useTenantLocations,
} from "@/lib/location";
import { fetchBusinesses } from "@/lib/business/business-client";
import { fetchHelpRequests } from "@/lib/marketplace/commerce-client";
import { fetchCommunityFeed } from "@/lib/community/community-client";
import { openActionComposer } from "@/lib/community/action-composer-client";
import { LIVING_EMPTY_GLYPH } from "@/lib/community/composer-glyphs";
import { LivingFeedCard } from "@/components/community/LivingFeedCard";
import { LifePlaceHost } from "@/components/life-place/LifePlaceHost";
import type { BusinessProfile, HelpRequest } from "@life-community-os/types";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
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
    authenticated,
    hasMembership,
  } = useTenant();
  const { sessionReady } = useCurrentUser();
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
  const [localProfessionals, setLocalProfessionals] = useState<BusinessProfile[]>([]);
  const [localBusinesses, setLocalBusinesses] = useState<BusinessProfile[]>([]);
  const [persistedGroups, setPersistedGroups] = useState<CommunityGroupRecord[]>([]);
  const [feedItems, setFeedItems] = useState<CommunityFeedItem[]>([]);
  const [placeLocationId, setPlaceLocationId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!sessionReady) return;
      if (authenticated && hasMembership) {
        const community = await fetchCommunityFeed(configuration.tenantId, {
          territoryId: experienceQuery?.territoryId ?? discoverQuery.territoryId,
        });
        if (!cancelled) {
          setPersistedGroups((community.groups as CommunityGroupRecord[]) ?? []);
          setFeedItems(community.items ?? []);
          setReasons(community.personalization?.reasons ?? {});
        }
      } else if (!cancelled) {
        setPersistedGroups([]);
        setFeedItems([]);
      }
      if (!canLocal) {
        if (!cancelled) {
          setNeighbourTips([]);
          setLocalProfessionals([]);
          setLocalBusinesses([]);
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
          const filtered = rows.filter((item) => {
            if (!q) return true;
            return (
              item.name.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q)
            );
          });
          const ordered = sortLocalServiceCards(
            filtered.map((item) => businessToLocalServiceCard(item)),
          );
          const professionals: BusinessProfile[] = [];
          const businesses: BusinessProfile[] = [];
          for (const card of ordered) {
            const row = filtered.find((item) => item.id === card.id);
            if (!row) continue;
            if (card.kind === "professional" || isProfessionalBusiness(row)) {
              professionals.push(row);
            } else {
              businesses.push(row);
            }
          }
          setLocalProfessionals(professionals);
          setLocalBusinesses(businesses);
        }
      } else {
        setLocalProfessionals([]);
        setLocalBusinesses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    sessionReady,
    authenticated,
    hasMembership,
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

  const living = useMemo(
    () => partitionLivingCommunityFeed(feedItems),
    [feedItems],
  );
  const nowNear = useMemo(() => {
    const q = query.trim().toLowerCase();
    return living.now.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.metadata?.locationLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [living.now, query]);
  const upcomingPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return living.upcoming.filter((item) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        (item.metadata?.locationLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [living.upcoming, query]);

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

  const hasPlans = nowNear.length > 0 || upcomingPlans.length > 0 || groups.length > 0;
  const hasAnything =
    nearYou.length > 0 ||
    neighbourTips.length > 0 ||
    hasPlans ||
    localProfessionals.length > 0 ||
    localBusinesses.length > 0 ||
    living.help.length > 0;

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Descubrir"
        subtitle="Territorio, intereses, disponibilidad y momento."
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
          title={query ? "Sin resultados" : LIVING_EMPTY_TITLE}
          description={
            query ? "Prueba con otras palabras." : LIVING_EMPTY_DESCRIPTION
          }
          imageUrl={query ? undefined : LIVING_EMPTY_GLYPH}
          actionLabel={
            query
              ? "Limpiar búsqueda"
              : authenticated && hasMembership
                ? LIVING_EMPTY_CTA
                : "Ver el mapa"
          }
          onAction={
            query
              ? () => setQuery("")
              : authenticated && hasMembership
                ? () => openActionComposer({ source: "discover" })
                : () => router.push("/map")
          }
        />
      ) : (
        <div className="space-y-10">
          {nowNear.length > 0 ? (
            <CommunityLifeSection
              title="Ahora cerca"
              subtitle="Territorio, tus intereses y el momento. Siempre verás por qué."
            >
              <div className="space-y-4">
                {nowNear.map((item, index) => (
                  <LivingFeedCard
                    key={item.id}
                    item={item}
                    index={index}
                    reason={reasons[item.id]}
                    onOpenPlace={setPlaceLocationId}
                    onOpenHref={(href) => router.push(href)}
                  />
                ))}
              </div>
            </CommunityLifeSection>
          ) : null}

          {upcomingPlans.length > 0 ? (
            <CommunityLifeSection
              title="Planes próximos"
              subtitle="Momentos que vienen."
            >
              <div className="space-y-4">
                {upcomingPlans.map((item, index) => (
                  <LivingFeedCard
                    key={item.id}
                    item={item}
                    index={index}
                    reason={reasons[item.id]}
                    onOpenPlace={setPlaceLocationId}
                    onOpenHref={(href) => router.push(href)}
                  />
                ))}
              </div>
            </CommunityLifeSection>
          ) : null}

          {nearYou.length > 0 ? (
            <CommunityLifeSection
              title="Lugares vivos"
              subtitle="Abre cada lugar y mira qué ocurre."
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
                    onClick={() => {
                      if (place.id) setPlaceLocationId(place.id);
                    }}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}

          {neighbourTips.length > 0 ? (
            <CommunityLifeSection
              title="Ayuda entre vecinos"
              subtitle="Ofertas de ayuda del territorio, no un marketplace."
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

          {groups.length > 0 ? (
            <CommunityLifeSection
              title="Comunidades"
              subtitle="Grupos donde ya hay vida."
            >
              <div className="grid grid-cols-2 gap-3 pt-2">
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    name={g.name}
                    members={0}
                    imageUrl={g.imageUrl ?? ""}
                    onOpen={() => router.push(`/community/groups/${g.id}`)}
                  />
                ))}
              </div>
            </CommunityLifeSection>
          ) : null}

          {localProfessionals.length > 0 ? (
            <CommunityLifeSection
              title="Profesionales"
              subtitle="Oficios locales del territorio."
            >
              <LocalLifeRail>
                {localProfessionals.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.category}
                    areaLabel={configuration.branding.name}
                    blurb={place.description}
                    imageUrl={place.imageUrl ?? ""}
                    onClick={() => setPlaceLocationId(place.locationId)}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}

          {localBusinesses.length > 0 ? (
            <CommunityLifeSection
              title="Negocios locales"
              subtitle="Comercios del territorio, no un ranking."
            >
              <LocalLifeRail>
                {localBusinesses.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.category}
                    areaLabel={configuration.branding.name}
                    blurb={place.description}
                    imageUrl={place.imageUrl ?? ""}
                    onClick={() => setPlaceLocationId(place.locationId)}
                  />
                ))}
              </LocalLifeRail>
            </CommunityLifeSection>
          ) : null}
        </div>
      )}
      {authenticated && hasMembership ? (
        <button
          type="button"
          onClick={() => openActionComposer({ source: "discover" })}
          className="ui-press ui-lift mt-8 w-full rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)]"
        >
          <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
            Qué puedo aportar
          </span>
          <span className="mt-0.5 block text-[13px] text-[var(--color-text-tertiary)]">
            Organiza, pide ayuda o comparte con tu comunidad.
          </span>
        </button>
      ) : null}
      <LifePlaceHost
        tenantId={configuration.tenantId}
        locationId={placeLocationId}
        territoryId={activeTerritory.territoryId}
        onClose={() => setPlaceLocationId(null)}
      />
    </MobileScreen>
  );
}
