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
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

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
  const { theme, isFeatureEnabled, hasCapability, demoMember } = useTenant();

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

  /** Open moments are the heart of Home — real experiences, real neighbours. */
  const moments = useMemo(() => {
    if (!canExperiences) return [];
    return listHomeMomentCards({ limit: MOMENT_LIMIT, ...frontDoorOpts });
  }, [canExperiences, frontDoorOpts]);

  const moves = useMemo(() => listHomeMoves(), []);
  const intents = useMemo(() => listHomeIntents(), []);
  const nearby = useMemo(
    () => (canLocal ? listHomeNearbyPlaces() : []),
    [canLocal],
  );

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
    <div className="life-home overflow-x-hidden bg-[var(--life-bg,#001219)] pb-1">
      <HomeHeroStage
        slides={heroSlides}
        initialIndex={heroInitialIndex}
        greeting={greeting}
        tagline={tagline}
        description="Descubre, participa y disfruta de lo que ocurre cerca de ti."
        pills={heroPills}
        underChrome={false}
      />

      <div className="space-y-[15px] px-2.5 md:px-0">
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
          <div className="mt-2.5">
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
          <HomeRail className="mt-2.5">
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
                imageUrl={experience.imageUrl}
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
      <section>
        <HomeSectionHead
          title="La comunidad se mueve"
          actionLabel="Ver más"
          onAction={() => router.push("/community")}
        />
        <HomeRail className="mt-2.5">
          {moves.map((move) => (
            <HomeMoveCard
              key={move.id}
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

      {/* ── QUÉ TE APETECE HACER — four translucent doors ── */}
      <section>
        <HomeSectionHead title="¿Qué te apetece hacer?" />
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {intents.map((intent) => (
            <HomeIntentCard
              key={intent.id}
              tone={intent.tone}
              glyph={intent.glyph}
              title={intent.title}
              subtitle={intent.subtitle}
              imageUrl={intent.imageUrl}
              onClick={() => router.push(intent.href)}
            />
          ))}
        </div>
      </section>

      {/* ── CERCA DE TI — places the community points at ── */}
      {canLocal && nearby.length > 0 ? (
        <section>
          <HomeSectionHead
            title="Cerca de ti"
            actionLabel="Ver mapa"
            actionGlyph="map"
            onAction={() => router.push("/discover")}
          />
          <HomeRail className="mt-2.5">
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
