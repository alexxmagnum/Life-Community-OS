"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  homeHeroIndexForHour,
  homeSkyMood,
  listHomeHeroSlideUrls,
} from "@life-community-os/tenant-life-panoramica";
import {
  communityFeedLivingLabel,
  communityFeedPrimaryLabel,
  communityFeedTimeLabel,
  HOME_ANNOUNCEMENTS_EMPTY,
  HOME_SERVICES_EMPTY_CTA,
  HOME_SERVICES_EMPTY_TITLE,
  isLivingMomentFeedItem,
  LIVING_EMPTY_CTA,
  LIVING_EMPTY_DESCRIPTION,
  LIVING_EMPTY_TITLE,
  lifeMapHrefForFeedItem,
  partitionLivingCommunityFeed,
  territoryHomeQuery,
  type CommunityFeedItem,
  type CommunityInsight,
  type TerritoryAnnouncement,
  type TerritoryDailyPulse,
} from "@life-community-os/types";
import {
  EmptyState,
  HomeHeroStage,
  HomeMomentCard,
  HomeMoveCard,
  HomeNearbyCard,
  HomeRail,
  HomeSectionHead,
  staggerItemProps,
  type HomeHeroPill,
  type HomeHeroSlide,
} from "@life-community-os/ui";
import { getCommunityExperienceFeed, fetchCommunityHome } from "@/lib/community/community-client";
import { fetchTerritoryAnnouncements } from "@/lib/community/community-operations-client";
import { openActionComposer } from "@/lib/community/action-composer-client";
import { COMMUNITY_EMPTY_GLYPH, LIVING_EMPTY_GLYPH } from "@/lib/community/composer-glyphs";
import { locationCardImageUrl, communityFeedCardImageUrl } from "@/lib/location/location-card-asset";
import { LifePlaceHost } from "@/components/life-place/LifePlaceHost";
import { useTenantLocations } from "@/lib/location";
import { preferEntityMediaUrl } from "@/lib/media/media-policy";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTerritory } from "@/providers/TerritoryProvider";
import {
  VISITOR_HOME_DESCRIPTION,
  VISITOR_HOME_EMPTY_DESCRIPTION,
  VISITOR_HOME_EMPTY_TITLE,
  VISITOR_HOME_EXPLORE_LABEL,
  VISITOR_HOME_REGISTER_LABEL,
  VISITOR_JOIN_HEADLINE,
  VISITOR_VALUE_PROPOSITION,
  visitorConversionHref,
  visitorConversionLabel,
} from "@/lib/membership/visitor-experience";

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

function belongingGreeting(name: string, hour: number): string {
  const salutation =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  return `${salutation}, ${name}`;
}

function feedMomentToAnnouncement(
  item: CommunityFeedItem,
  tenantId: string,
  territoryId: string,
): TerritoryAnnouncement {
  return {
    id: item.id,
    tenantId,
    territoryId,
    title: item.title,
    body: item.description ?? "",
    createdAt: item.startsAt ?? new Date().toISOString(),
  };
}

function madridHour(nowMs = Date.now()): number {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).format(new Date(nowMs));
  return Number(hourStr);
}

const MOMENT_LIMIT = 6;

/**
 * Home = the place where Panorámica lives today.
 * One dense mobile stage: what is happening, who is moving, what to do,
 * what is near. Participation, decisions and official information live in
 * Comunidad.
 */
export function HomeScreen() {
  const router = useRouter();
  const {
    theme,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    configuration,
    authenticated,
    hasMembership,
  } = useTenant();
  const { currentUser, sessionReady } = useCurrentUser();
  const { context: activeTerritory } = useTerritory();
  const { allLocations } = useTenantLocations(
    configuration.tenantId,
    activeTerritory.territoryId,
  );
  const homeQuery = territoryHomeQuery(activeTerritory);
  const [feedItems, setFeedItems] = useState<CommunityFeedItem[]>([]);
  const [feedReady, setFeedReady] = useState(false);
  const [placeLocationId, setPlaceLocationId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [favoriteLocations, setFavoriteLocations] = useState<string[]>([]);
  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [pulse, setPulse] = useState<TerritoryDailyPulse | null>(null);
  const [announcements, setAnnouncements] = useState<TerritoryAnnouncement[]>([]);

  const [hour, setHour] = useState(18);
  const [greeting, setGreeting] = useState(
    () => `Hola, ${currentUser.displayName || currentUser.email?.split("@")[0] || "vecino"}`,
  );
  const todaySectionRef = useRef<HTMLDivElement | null>(null);

  const territoryName =
    activeTerritory.territoryName ??
    theme.identity?.territoryName ??
    theme.logoText;
  const placeName = theme.shortName || territoryName;

  useEffect(() => {
    const current = madridHour();
    setHour(current);
    const isVisitor = !currentUser.authenticated || !currentUser.hasMembership;
    const displayName =
      currentUser.displayName || currentUser.email?.split("@")[0] || "vecino";
    setGreeting(
      isVisitor
        ? `Bienvenido a ${placeName}`
        : belongingGreeting(displayName, current),
    );
  }, [
    currentUser.authenticated,
    currentUser.displayName,
    currentUser.email,
    currentUser.hasMembership,
    placeName,
  ]);

  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    placeName,
  );

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);
  const canExperiences =
    isFeatureEnabled("experiences") &&
    hasCapability(CAPABILITIES.experienceView) &&
    homeQuery.sources.includes("experience");
  const isVisitor = !authenticated || !hasMembership;
  const canCreateExperience =
    canExperiences && hasCapability(CAPABILITIES.experienceCreate);

  useEffect(() => {
    let cancelled = false;
    const territoryId = homeQuery.territoryId;
    if (!sessionReady) return;
    setFeedReady(false);
    void fetchCommunityHome({
      tenantId: configuration.tenantId,
      territoryId,
    }).then((home) => {
      if (cancelled) return;
      if (home) {
        const items = [
          ...home.moments,
          ...home.currentActivities,
          ...home.upcomingActivities,
        ];
        setFeedItems(items);
        const importantMoments = home.moments
          .slice(0, 3)
          .map((item) =>
            feedMomentToAnnouncement(
              item,
              configuration.tenantId,
              territoryId ?? "",
            ),
          );
        setPulse({
          tenantId: configuration.tenantId,
          territoryId: territoryId ?? "",
          now: home.currentActivities,
          next: home.upcomingActivities,
          important: importantMoments,
          community: items,
        });
        setAnnouncements(importantMoments);
        setInsights(
          (home.forYouToday ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            body: row.reason,
            reason: row.reason,
            href: row.href,
          })),
        );
        setPersonalizationEnabled(home.membershipScope === "active");
        setFeedReady(true);
        return;
      }
      if ((!authenticated || !hasMembership) && territoryId) {
        void fetchTerritoryAnnouncements({
          tenantId: configuration.tenantId,
          territoryId,
        }).then((rows) => {
          if (cancelled) return;
          if (rows.length > 0) setAnnouncements(rows.slice(0, 3));
        });
      }
      if (!authenticated || !hasMembership || !territoryId) {
        setFeedItems([]);
        setReasons({});
        setPersonalizationEnabled(false);
        setFeedReady(true);
        return;
      }
      void getCommunityExperienceFeed({
        tenantId: configuration.tenantId,
        territoryId,
      }).then((data) => {
        if (cancelled) return;
        setFeedItems(data.items);
        setReasons(data.reasons);
        setPersonalizationEnabled(data.personalizationEnabled);
        setFeedReady(true);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    sessionReady,
    authenticated,
    hasMembership,
    configuration.tenantId,
    homeQuery.territoryId,
  ]);

  const living = useMemo(
    () => partitionLivingCommunityFeed(feedItems),
    [feedItems],
  );

  /** Open moments — Territory feed projection of existing domains. */
  const moments = useMemo(() => {
    if (!feedReady) return [];
    const source =
      pulse?.now && pulse.now.length > 0
        ? pulse.now
        : personalizationEnabled && living.now.length > 0
          ? living.now
          : feedItems.filter(isLivingMomentFeedItem);
    return source.slice(0, MOMENT_LIMIT).map((item) => ({
      item,
      presentation: {
        tone: "open" as const,
        glyph: "people" as const,
        whereLabel:
          item.metadata?.locationLabel || item.description || placeName,
        statusLabel:
          reasons[item.id] ||
          communityFeedLivingLabel(item) ||
          (item.capacity
            ? `${item.capacity.available} plazas disponibles`
            : "Abierto"),
        ctaLabel: communityFeedPrimaryLabel(item),
        badgeLabel: communityFeedTimeLabel(item) || "Hoy",
      },
    }));
  }, [
    feedReady,
    feedItems,
    living.now,
    pulse,
    personalizationEnabled,
    placeName,
    reasons,
  ]);

  const upcomingMoments = useMemo(() => {
    if (!feedReady) return [];
    if (pulse?.next && pulse.next.length > 0) {
      return pulse.next.slice(0, MOMENT_LIMIT);
    }
    return living.upcoming.slice(0, MOMENT_LIMIT);
  }, [feedReady, living.upcoming, pulse]);

  const favoritePlaces = useMemo(() => {
    if (favoriteLocations.length === 0) return [];
    return allLocations.filter((loc) => favoriteLocations.includes(loc.id));
  }, [allLocations, favoriteLocations]);

  const moves = useMemo(
    () =>
      feedItems
        .filter(
          (item) =>
            item.type === "community" || item.type === "business_activity",
        )
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          tone: "default" as const,
          glyph: "people" as const,
          headline: item.title,
          meta: item.description || communityFeedPrimaryLabel(item),
          quote: undefined as string | undefined,
          personName: undefined as string | undefined,
          personAvatarUrl: undefined as string | undefined,
          liked: false,
          href: lifeMapHrefForFeedItem(item),
        })),
    [feedItems],
  );
  const nearby = useMemo(() => {
    if (!canLocal) return [];
    return allLocations
      .filter((loc) => loc.visibility !== "private")
      .slice(0, 8)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        imageUrl:
          preferEntityMediaUrl(undefined, loc.imageUrl) ||
          locationCardImageUrl(loc),
        distanceLabel: loc.areaLabel ?? configuration.branding.name,
        statusLabel: loc.category,
        ratingLabel: undefined as string | undefined,
        ratingCountLabel: undefined as string | undefined,
        badgeLabel: undefined as string | undefined,
        href: `/map?focus=${encodeURIComponent(loc.id)}`,
      }));
  }, [canLocal, allLocations, configuration.branding.name]);

  const heroSlides = useMemo((): HomeHeroSlide[] => {
    const sources = listHomeHeroSlideUrls(theme.imagery);
    return sources.map((imageUrl, index) => ({
      id: `hero-${index}`,
      imageUrl,
      alt: territoryName,
    }));
  }, [territoryName, theme.imagery]);

  const heroInitialIndex = homeHeroIndexForHour(hour);

  /** Sky reading first, then how much life is open around you. */
  const heroPills = useMemo((): HomeHeroPill[] => {
    const sky = homeSkyMood(hour);
    const happening = moments.length + moves.length;
    return [
      {
        id: "sky",
        label: `${sky.title} ${sky.subtitle}`,
        icon: "sun",
      },
      {
        id: "happening",
        label: `${happening} cosas sucediendo cerca`,
        icon: "spark",
        onClick: () =>
          todaySectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
      },
    ];
  }, [hour, moments.length, moves.length]);

  /** Territory name + what is happening today — place is context, not the actor. */
  const tagline = isVisitor
    ? `${placeName}\ntiene vida cerca de ti.`
    : moments.length > 0
      ? `${placeName}\ntiene actividad hoy.`
      : `${placeName}\nestá tranquila hoy.`;

  const heroDescription = isVisitor
    ? VISITOR_HOME_DESCRIPTION
    : "Descubre, participa y disfruta de lo que ocurre cerca de ti.";

  return (
    <div className="life-home overflow-x-hidden bg-[var(--life-bg,var(--color-surface-app))] pb-1">
      <HomeHeroStage
        slides={heroSlides}
        initialIndex={heroInitialIndex}
        greeting={greeting}
        tagline={tagline}
        description={heroDescription}
        pills={heroPills}
        underChrome={false}
      />

      <div className="space-y-7 px-4 md:px-0">
      {isVisitor ? (
        <section className="rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 shadow-[var(--shadow-elev-1)]">
          <p className="text-[14px] leading-snug text-[var(--color-text-secondary)]">
            {VISITOR_VALUE_PROPOSITION}
          </p>
          <button
            type="button"
            onClick={() => router.push(visitorConversionHref(authenticated))}
            className="ui-press ui-lift mt-4 w-full rounded-[16px] bg-[var(--color-action-primary)] px-4 py-3 text-left shadow-[var(--shadow-elev-1)]"
          >
            <span className="block font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-on-action)]">
              {VISITOR_JOIN_HEADLINE}
            </span>
            <span className="mt-1 block text-[14px] text-[var(--color-text-on-action)]/85">
              {visitorConversionLabel(authenticated)} para participar y crear.
            </span>
          </button>
        </section>
      ) : null}
      {/* ── HOY — Territory first, then the life happening in it ── */}
      <section ref={todaySectionRef} className="scroll-mt-[64px]">
        <HomeSectionHead title={todayTitle} sparkle />
        {announcements.length > 0 ? (
          <div className="mb-4 space-y-2">
            {announcements.slice(0, 3).map((item) => (
              <p
                key={item.id}
                className="rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-3 text-[14px] text-[var(--color-text-primary)]"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  Información importante
                </span>
                <span className="mt-1 block font-semibold">{item.title}</span>
                <span className="mt-0.5 block text-[13px] text-[var(--color-text-secondary)]">
                  {item.body}
                </span>
              </p>
            ))}
          </div>
        ) : (
          <p className="mb-4 rounded-[16px] border border-dashed border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)]/60 px-4 py-3 text-[14px] text-[var(--color-text-secondary)]">
            {HOME_ANNOUNCEMENTS_EMPTY}
          </p>
        )}
        <p className="mb-3 text-[14px] text-white/55">Ahora mismo</p>
        {moments.length === 0 ? (
          <div>
            {isVisitor ? (
              <>
                <EmptyState
                  title={VISITOR_HOME_EMPTY_TITLE}
                  description={VISITOR_HOME_EMPTY_DESCRIPTION}
                  imageUrl={COMMUNITY_EMPTY_GLYPH}
                  actionLabel={VISITOR_HOME_EXPLORE_LABEL}
                  onAction={() => router.push("/community")}
                />
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="ui-press mt-3 w-full min-h-[44px] rounded-full bg-[var(--color-surface-muted)] px-4 text-[14px] font-semibold text-[var(--color-text-secondary)]"
                >
                  {VISITOR_HOME_REGISTER_LABEL}
                </button>
              </>
            ) : (
              <EmptyState
                title={LIVING_EMPTY_TITLE}
                description={LIVING_EMPTY_DESCRIPTION}
                imageUrl={LIVING_EMPTY_GLYPH}
                actionLabel={
                  canCreateExperience ? LIVING_EMPTY_CTA : undefined
                }
                onAction={
                  canCreateExperience
                    ? () => openActionComposer({ source: "home" })
                    : undefined
                }
              />
            )}
          </div>
        ) : (
          <HomeRail>
            {moments.map(({ item, presentation }, index) => {
              const stagger = staggerItemProps(index);
              return (
              <HomeMomentCard
                key={item.id}
                className={stagger.className}
                tone="open"
                badgeLabel={presentation.badgeLabel}
                glyph={presentation.glyph}
                title={item.title}
                where={presentation.whereLabel}
                imageUrl={
                  item.metadata?.imageUrl?.trim() ||
                  communityFeedCardImageUrl(item)
                }
                peopleLabel={communityFeedLivingLabel(item)}
                statusLabel={presentation.statusLabel}
                ctaLabel={presentation.ctaLabel}
                onClick={() => {
                  if (item.locationId) {
                    setPlaceLocationId(item.locationId);
                    return;
                  }
                  router.push(lifeMapHrefForFeedItem(item));
                }}
                onCta={() => router.push(lifeMapHrefForFeedItem(item))}
              />
              );
            })}
          </HomeRail>
        )}
      </section>

      {insights.length > 0 ? (
        <section className="space-y-2">
          {insights.map((insight) => (
            <button
              key={insight.id}
              type="button"
              onClick={() => insight.href && router.push(insight.href)}
              className="ui-press w-full rounded-[18px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-3 text-left shadow-[var(--shadow-elev-1)]"
            >
              <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
                {insight.title}
              </span>
              <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">
                {insight.body}
              </span>
              <span className="mt-1 block text-[12px] text-[var(--color-text-tertiary)]">
                Porque: {insight.reason}
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {isModuleEnabled("services") ? (
        <section>
          <HomeSectionHead title={HOME_SERVICES_EMPTY_TITLE} />
          <button
            type="button"
            onClick={() => router.push("/services")}
            className="ui-press ui-lift w-full rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)]"
          >
            <span className="block font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
              Servicios cerca
            </span>
            <span className="mt-1 block text-[14px] text-[var(--color-text-tertiary)]">
              Profesionales, ayuda vecinal, movilidad y marketplace.
            </span>
            <span className="mt-2 block text-[14px] font-semibold text-[var(--color-action-primary)]">
              {HOME_SERVICES_EMPTY_CTA}
            </span>
          </button>
        </section>
      ) : null}

      {upcomingMoments.length > 0 ? (
        <section>
          <HomeSectionHead title="Próximamente" />
          <HomeRail>
            {upcomingMoments.map((item) => (
              <HomeMomentCard
                key={item.id}
                tone="soon"
                badgeLabel={communityFeedTimeLabel(item) || "Pronto"}
                glyph="calendar"
                title={item.title}
                where={item.metadata?.locationLabel || placeName}
                imageUrl={
                  item.metadata?.imageUrl?.trim() ||
                  communityFeedCardImageUrl(item)
                }
                peopleLabel={communityFeedLivingLabel(item)}
                statusLabel={reasons[item.id]}
                ctaLabel={communityFeedPrimaryLabel(item)}
                onClick={() => {
                  if (item.locationId) setPlaceLocationId(item.locationId);
                  else router.push(lifeMapHrefForFeedItem(item));
                }}
                onCta={() => router.push(lifeMapHrefForFeedItem(item))}
              />
            ))}
          </HomeRail>
        </section>
      ) : null}

      {authenticated && hasMembership && favoritePlaces.length > 0 ? (
        <section>
          <HomeSectionHead title="Mis lugares" actionLabel="Mapa" actionGlyph="map" onAction={() => router.push("/map")} />
          <HomeRail>
            {favoritePlaces.map((place) => (
              <HomeNearbyCard
                key={place.id}
                name={place.name}
                imageUrl={
                  preferEntityMediaUrl(undefined, place.imageUrl) ||
                  locationCardImageUrl(place)
                }
                distanceLabel={place.areaLabel ?? configuration.branding.name}
                statusLabel="Favorito"
                onClick={() => setPlaceLocationId(place.id)}
              />
            ))}
          </HomeRail>
        </section>
      ) : null}

      {authenticated && hasMembership ? (
        <section>
          <HomeSectionHead title="Cómo puedo aportar" />
          <button
            type="button"
            onClick={() => openActionComposer({ source: "home" })}
            className="ui-press ui-lift w-full rounded-[20px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)]"
          >
            <span className="block font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--color-text-primary)]">
              Crear para hoy
            </span>
            <span className="mt-1 block text-[14px] text-[var(--color-text-tertiary)]">
              {LIVING_EMPTY_CTA}
            </span>
          </button>
        </section>
      ) : null}

      {moves.length > 0 ? (
      <section>
        <HomeSectionHead
          title="La comunidad"
          actionLabel="Ver más"
          onAction={() => router.push("/community")}
        />
        <HomeRail>
          {moves.map((move) => (
            <HomeMoveCard
              key={move.id}
              tone={move.tone}
              glyph={move.glyph}
              headline={move.headline}
              meta={move.meta}
              quote={move.quote}
              personName={move.personName}
              personAvatarUrl={move.personAvatarUrl}
              liked={move.liked}
              onClick={() => router.push(move.href)}
            />
          ))}
        </HomeRail>
      </section>
      ) : null}

      {canLocal && nearby.length > 0 ? (
        <section>
          <HomeSectionHead
            title="Cerca de ti"
            actionLabel="Ver mapa"
            actionGlyph="map"
            onAction={() => router.push("/map")}
          />
          <HomeRail>
            {nearby.map((place) => (
              <HomeNearbyCard
                key={place.id}
                name={place.name}
                imageUrl={place.imageUrl}
                distanceLabel={place.distanceLabel}
                statusLabel={place.statusLabel}
                ratingLabel={place.ratingLabel}
                ratingCountLabel={place.ratingCountLabel}
                badgeLabel={place.badgeLabel}
                onClick={() => setPlaceLocationId(place.id)}
              />
            ))}
          </HomeRail>
        </section>
      ) : null}
      </div>
      <LifePlaceHost
        tenantId={configuration.tenantId}
        locationId={placeLocationId}
        territoryId={activeTerritory.territoryId}
        onClose={() => setPlaceLocationId(null)}
      />
    </div>
  );
}
