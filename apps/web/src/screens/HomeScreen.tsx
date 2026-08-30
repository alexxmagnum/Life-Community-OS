"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceTime,
  homeHeroIndexForHour,
  homeSkyMood,
  listHomeHeroSlideUrls,
  listHomeIntents,
} from "@life-community-os/tenant-life-panoramica";
import {
  communityFeedPrimaryLabel,
  lifeMapHrefForFeedItem,
  territoryHomeQuery,
  type CommunityFeedItem,
} from "@life-community-os/types";
import {
  EmptyState,
  HomeHeroStage,
  HomeIntentCard,
  HomeMomentCard,
  HomeMoveCard,
  HomeNearbyCard,
  HomeRail,
  HomeSectionHead,
  type HomeHeroPill,
  type HomeHeroSlide,
} from "@life-community-os/ui";
import { getCommunityExperienceFeed } from "@/lib/community/community-client";
import { useTenantLocations } from "@/lib/location";
import { preferEntityMediaUrl } from "@/lib/media/media-policy";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

const HOY_FEED_TYPES = new Set([
  "experience",
  "event",
  "reservation",
  "resource_activity",
]);

const LOCATION_NEARBY_FALLBACK_IMAGE =
  "/assets/3d/platform/community/neighbours/scene/neighbours.webp";

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

function belongingGreeting(name: string, hour: number): string {
  const salutation =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  return `${salutation}, ${name}`;
}

function madridHour(nowMs = Date.now()): number {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).format(new Date(nowMs));
  return Number(hourStr);
}

/** How many open moments the main rail shows before deferring to /experiences. */
const MOMENT_LIMIT = 3;

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
    hasCapability,
    tenantSlug,
    configuration,
    homeMode,
  } = useTenant();
  const { currentUser } = useCurrentUser();
  const { context: activeTerritory } = useTerritory();
  const { allLocations } = useTenantLocations(
    configuration.tenantId,
    activeTerritory.territoryId,
  );
  const premiumHome = homeMode === "premium";
  const homeQuery = territoryHomeQuery(activeTerritory);
  const [feedItems, setFeedItems] = useState<CommunityFeedItem[]>([]);
  const [feedReady, setFeedReady] = useState(false);

  const [hour, setHour] = useState(18);
  const [greeting, setGreeting] = useState(
    () => `Hola, ${currentUser.displayName || currentUser.email?.split("@")[0] || "vecino"}`,
  );
  const todaySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const current = madridHour();
    setHour(current);
    setGreeting(
      belongingGreeting(
        currentUser.displayName || currentUser.email?.split("@")[0] || "vecino",
        current,
      ),
    );
  }, [currentUser.displayName, currentUser.email]);

  const territoryName =
    activeTerritory.territoryName ??
    theme.identity?.territoryName ??
    theme.logoText;
  const placeName = theme.shortName || territoryName;
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

  useEffect(() => {
    let cancelled = false;
    const territoryId = homeQuery.territoryId;
    if (!territoryId) {
      setFeedItems([]);
      setFeedReady(true);
      return;
    }
    setFeedReady(false);
    void getCommunityExperienceFeed({
      tenantId: configuration.tenantId,
      territoryId,
    }).then((data) => {
      if (cancelled) return;
      setFeedItems(data.items);
      setFeedReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, homeQuery.territoryId]);

  /** Open moments — Territory feed projection of existing domains. */
  const moments = useMemo(() => {
    if (!feedReady) return [];
    return feedItems
      .filter((item) => HOY_FEED_TYPES.has(item.type))
      .slice(0, MOMENT_LIMIT)
      .map((item) => ({
        item,
        presentation: {
          tone: "open" as const,
          glyph: "people" as const,
          whereLabel:
            item.metadata?.locationLabel || item.description || placeName,
          statusLabel: item.capacity
            ? `${item.capacity.available} plazas disponibles`
            : "Abierto",
          ctaLabel: communityFeedPrimaryLabel(item),
          badgeLabel: item.startsAt
            ? formatExperienceTime(item.startsAt)
            : "Hoy",
        },
      }));
  }, [feedReady, feedItems, placeName]);

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
  const intents = useMemo(() => {
    if (premiumHome) return listHomeIntents();
    return [
      {
        id: `${tenantSlug}-map`,
        title: "Map",
        subtitle: theme.identity?.homeCallout ?? theme.tagline ?? placeName,
        tone: "discover" as const,
        glyph: "compass" as const,
        href: "/map",
        imageUrl: LOCATION_NEARBY_FALLBACK_IMAGE,
        bgImageUrl: undefined as string | undefined,
      },
      {
        id: `${tenantSlug}-plans`,
        title: "Plans",
        subtitle: theme.identity?.pulseTitleTemplate
          ? theme.identity.pulseTitleTemplate.replaceAll("{territory}", placeName)
          : placeName,
        tone: "plans" as const,
        glyph: "calendar" as const,
        href: "/experiences",
        imageUrl: LOCATION_NEARBY_FALLBACK_IMAGE,
        bgImageUrl: undefined as string | undefined,
      },
      {
        id: `${tenantSlug}-discover`,
        title: "Discover",
        subtitle: placeName,
        tone: "discover" as const,
        glyph: "compass" as const,
        href: "/discover",
        imageUrl: LOCATION_NEARBY_FALLBACK_IMAGE,
        bgImageUrl: undefined as string | undefined,
      },
    ];
  }, [premiumHome, tenantSlug, theme, placeName]);
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
          LOCATION_NEARBY_FALLBACK_IMAGE,
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

  /** The break is intentional: place first, then the state it is in. */
  const tagline =
    moments.length > 0
      ? `${placeName}\nestá viva hoy.`
      : `${placeName}\nrespira tranquila.`;

  return (
    <div className="life-home overflow-x-hidden bg-[var(--life-bg,var(--color-surface-app))] pb-1">
      <HomeHeroStage
        slides={heroSlides}
        initialIndex={heroInitialIndex}
        greeting={greeting}
        tagline={tagline}
        description="Descubre, participa y disfruta de lo que ocurre cerca de ti."
        pills={heroPills}
        underChrome={false}
      />

      <div className="space-y-7 px-4 md:px-0">
      {/* ── HOY — open moments with real neighbours ── */}
      <section ref={todaySectionRef} className="scroll-mt-[64px]">
        <HomeSectionHead
          title={todayTitle}
          sparkle
          actionLabel={moments.length > 0 ? "Ver todas" : undefined}
          onAction={
            moments.length > 0 ? () => router.push("/experiences") : undefined
          }
        />
        {moments.length === 0 ? (
          <div>
            <EmptyState
              title="Hoy está tranquilo por aquí."
              description="Cuando alguien abra un plan, lo verás aquí."
              actionLabel={
                canExperiences && hasCapability(CAPABILITIES.experienceCreate)
                  ? "Proponer un plan"
                  : undefined
              }
              onAction={
                canExperiences && hasCapability(CAPABILITIES.experienceCreate)
                  ? () => router.push("/experiences/create")
                  : undefined
              }
            />
          </div>
        ) : (
          <HomeRail>
            {moments.map(({ item, presentation }) => (
              <HomeMomentCard
                key={item.id}
                tone="open"
                badgeLabel={presentation.badgeLabel}
                glyph={presentation.glyph}
                title={item.title}
                where={presentation.whereLabel}
                imageUrl={
                  item.metadata?.imageUrl?.trim() ||
                  LOCATION_NEARBY_FALLBACK_IMAGE
                }
                peopleLabel={
                  item.capacity
                    ? `${item.capacity.available} plazas disponibles`
                    : undefined
                }
                statusLabel={presentation.statusLabel}
                ctaLabel={presentation.ctaLabel}
                onClick={() => router.push(lifeMapHrefForFeedItem(item))}
              />
            ))}
          </HomeRail>
        )}
      </section>

      {/* ── LA COMUNIDAD SE MUEVE — human activity, not a social feed ── */}
      {moves.length > 0 ? (
      <section>
        <HomeSectionHead
          title="La comunidad se mueve"
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

      {/* ── QUÉ TE APETECE HACER — four intent doors, horizontal rail ── */}
      <section>
        <HomeSectionHead title="¿Qué te apetece hacer?" />
        <HomeRail>
          {intents.map((intent) => (
            <HomeIntentCard
              key={intent.id}
              tone={intent.tone}
              glyph={intent.glyph}
              title={intent.title}
              subtitle={intent.subtitle}
              imageUrl={intent.imageUrl}
              bgImageUrl={intent.bgImageUrl}
              onClick={() => router.push(intent.href)}
            />
          ))}
        </HomeRail>
      </section>

      {/* ── CERCA DE TI — places the community points at ── */}
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
                onClick={() => router.push(place.href)}
              />
            ))}
          </HomeRail>
        </section>
      ) : null}
      </div>
    </div>
  );
}
