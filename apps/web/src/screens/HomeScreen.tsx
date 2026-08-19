"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatExperienceTime,
  homeHeroIndexForHour,
  homeSkyMood,
  listHomeHeroSlideUrls,
  listHomeIntents,
  listHomeMomentCards,
  listHomeMoves,
  listHomeNearbyPlaces,
} from "@life-community-os/tenant-life-panoramica";
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
import { useTenantLocations } from "@/lib/location";
import { useCatalogDomain } from "@/providers/CatalogProvider";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import type { Experience } from "@life-community-os/types";

const LOCATION_NEARBY_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80";

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

const HYDRATE_SAFE = {
  includeSessionExperiences: false,
  stabilizeTime: true,
} as const;

const LIVE_OPTS = {
  includeSessionExperiences: true,
  stabilizeTime: false,
} as const;

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
    demoMember,
    tenantSlug,
    configuration,
    homeMode,
  } = useTenant();
  const { allLocations } = useTenantLocations(configuration.tenantId);
  const { items: catalogExperiences, ready: catalogReady } =
    useCatalogDomain<Experience>("experiences");
  const premiumHome = homeMode === "premium";

  const [live, setLive] = useState(false);
  const [hour, setHour] = useState(18);
  const [greeting, setGreeting] = useState(
    () => `Hola, ${demoMember.displayName}`,
  );
  const todaySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const current = madridHour();
    setLive(true);
    setHour(current);
    setGreeting(belongingGreeting(demoMember.displayName, current));
  }, [demoMember.displayName]);

  const territoryName = theme.identity?.territoryName ?? theme.logoText;
  const placeName = theme.shortName || territoryName;
  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    placeName,
  );

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);
  const canExperiences =
    isFeatureEnabled("experiences") &&
    hasCapability(CAPABILITIES.experienceView);

  const frontDoorOpts = live ? LIVE_OPTS : HYDRATE_SAFE;

  /** Open moments — Panorámica pack or tenant catalog (never cross-tenant). */
  const moments = useMemo(() => {
    if (!canExperiences) return [];
    if (premiumHome) {
      return listHomeMomentCards({ limit: MOMENT_LIMIT, ...frontDoorOpts });
    }
    if (!catalogReady) return [];
    return catalogExperiences.slice(0, MOMENT_LIMIT).map((experience) => ({
      experience,
      presentation: {
        tone: "open" as const,
        glyph: "people" as const,
        whereLabel: experience.location,
        statusLabel: "Abierto",
        ctaLabel: "Ver",
        badgeLabel: undefined as string | undefined,
      },
    }));
  }, [
    canExperiences,
    premiumHome,
    frontDoorOpts,
    catalogReady,
    catalogExperiences,
  ]);

  const moves = useMemo(
    () => (premiumHome ? listHomeMoves() : []),
    [premiumHome],
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
    if (!premiumHome) {
      return allLocations
        .filter((loc) => loc.visibility !== "private")
        .slice(0, 8)
        .map((loc) => ({
          id: loc.id,
          name: loc.name,
          imageUrl: loc.imageUrl?.trim() || LOCATION_NEARBY_FALLBACK_IMAGE,
          distanceLabel: loc.areaLabel ?? configuration.branding.name,
          statusLabel: loc.category,
          ratingLabel: undefined as string | undefined,
          ratingCountLabel: undefined as string | undefined,
          badgeLabel: undefined as string | undefined,
          href: `/map?focus=${encodeURIComponent(loc.id)}`,
        }));
    }
    return listHomeNearbyPlaces();
  }, [
    canLocal,
    premiumHome,
    allLocations,
    configuration.branding.name,
  ]);

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
                hasCapability(CAPABILITIES.experienceCreate)
                  ? "Proponer un plan"
                  : undefined
              }
              onAction={
                hasCapability(CAPABILITIES.experienceCreate)
                  ? () => router.push("/experiences/create")
                  : undefined
              }
            />
          </div>
        ) : (
          <HomeRail>
            {moments.map(({ experience, presentation }) => (
              <HomeMomentCard
                key={experience.id}
                tone={
                  presentation.tone === "soon"
                    ? "soon"
                    : presentation.tone === "calm"
                      ? "calm"
                      : "open"
                }
                badgeLabel={
                  presentation.badgeLabel ??
                  formatExperienceTime(experience.startsAt)
                }
                glyph={presentation.glyph}
                title={experience.title}
                where={presentation.whereLabel ?? experience.location}
                imageUrl={
                  experience.imageUrl?.trim() || LOCATION_NEARBY_FALLBACK_IMAGE
                }
                people={experience.participants}
                peopleLabel={`${experience.participantCount} vecinos van`}
                statusLabel={presentation.statusLabel}
                ctaLabel={presentation.ctaLabel}
                onClick={() => router.push(`/experiences/${experience.id}`)}
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
