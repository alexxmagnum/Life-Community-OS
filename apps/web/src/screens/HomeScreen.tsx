"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  communityAlertIcon,
  communityAlertLevelLabel,
  communityAlertTone,
  experienceActivityLabel,
  explorerActivityHubs,
  formatExperienceWhen,
  listActiveCommunityAlerts,
  listCuratedNearYou,
  listRestaurants,
  listUpcomingHomeExperiences,
  searchHomeCatalog,
  spotsLeft,
  territoryDiscoveryAreaLabels,
} from "@life-community-os/tenant-life-panoramica";
import {
  ActivityCard,
  CommunityActivityCard,
  DiscoveryCard,
  EmptyState,
  GlobalAppSearch,
  HomeSection,
  LocalLifeRail,
  LocalPlaceCard,
  QuickActionBar,
  TerritoryHero,
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

/** Geometric line icons — design-system stroke language (no emoji as primary UI). */
function LineIcon({
  name,
  className,
}: {
  name: "pin" | "spark" | "chevron";
  className?: string;
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    className,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "pin":
      return (
        <svg {...common}>
          <path
            d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path
            d="M12 3.5v3.2M12 17.3v3.2M4.8 12H8M16 12h3.2M6.4 6.4l2.2 2.2M15.4 15.4l2.2 2.2M17.6 6.4l-2.2 2.2M8.6 15.4l-2.2 2.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common} width={14} height={14}>
          <path
            d="M9 6l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

const HYDRATE_SAFE = {
  includeSessionExperiences: false,
  stabilizeTime: true,
} as const;

const LIVE_OPTS = {
  includeSessionExperiences: true,
  stabilizeTime: false,
} as const;

/** How many open moments the main section shows before deferring to /experiences. */
const MOMENT_LIMIT = 3;
const LIFE_LIMIT = 4;
const NEAR_LIMIT = 3;

/**
 * Home = the place where Panorámica lives today.
 * Daily life only: what is happening, who is moving, what to do, what is near.
 * Participation, decisions and official information belong to Community.
 */
export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability, demoMember, demoPersonId } =
    useTenant();

  const [live, setLive] = useState(false);
  const [greeting, setGreeting] = useState(
    () => `Hola, ${demoMember.displayName}`,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const todaySectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLive(true);
    setGreeting(belongingGreeting(demoMember.displayName, madridHour()));
  }, [demoMember.displayName]);

  const searchHits = useMemo(
    () => searchHomeCatalog(searchQuery, 8),
    [searchQuery],
  );

  const territoryName = theme.identity?.territoryName ?? theme.logoText;
  const placeName = theme.shortName || territoryName;
  /** Short place name keeps the daily headline warm ("Hoy en Panoramica"). */
  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    placeName,
  );
  const areaLine =
    demoMember.areaLabel || theme.identity?.defaultAreaName || undefined;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);
  const canExperiences =
    isFeatureEnabled("experiences") &&
    hasCapability(CAPABILITIES.experienceView);

  const frontDoorOpts = live ? LIVE_OPTS : HYDRATE_SAFE;

  const alerts = useMemo(() => {
    const nowMs = live ? Date.now() : Date.parse("2026-08-09T12:00:00.000Z");
    return listActiveCommunityAlerts(nowMs);
  }, [live]);

  /** Hide stub weather when an exceptional alert is active — avoid double climate story. */
  const weatherLabel =
    alerts.length > 0 ? undefined : theme.identity?.weatherLabel;

  /** Open moments are the heart of Home — real experiences with real neighbours. */
  const moments = useMemo(() => {
    if (!canExperiences) return [];
    return listUpcomingHomeExperiences({
      limit: MOMENT_LIMIT,
      ...frontDoorOpts,
    });
  }, [canExperiences, frontDoorOpts]);

  /** Proposals are participation — they belong to Community, not to daily life. */
  const lifeItems = useMemo(
    () =>
      buildCommunityLifeItems({ limit: LIFE_LIMIT + 3 })
        .filter((item) => !item.id.startsWith("life-proposal-"))
        .slice(0, LIFE_LIMIT),
    [],
  );
  /** Lead with a neighbour, not with the community account. */
  const lifeFeatured =
    lifeItems.find((item) => item.imageUrl && item.personAvatarUrl) ??
    lifeItems.find((item) => item.imageUrl) ??
    lifeItems[0];
  const lifeRest = lifeItems.filter((item) => item.id !== lifeFeatured?.id);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listCuratedNearYou(demoMember, {
      limit: NEAR_LIMIT,
      preferredAreaLabels: territoryDiscoveryAreaLabels(demoPersonId),
    });
  }, [canLocal, demoMember, demoPersonId]);

  /** Doors carry a real photo from the destination — no hardcoded tenant palette. */
  const doors = useMemo(() => {
    const list: {
      id: string;
      title: string;
      subtitle: string;
      imageUrl: string;
      badge?: string;
      href: string;
    }[] = [];

    const nextMoment = moments[0];
    if (nextMoment) {
      list.push({
        id: "plans",
        title: "Planes",
        subtitle: "Encuentros",
        imageUrl: nextMoment.imageUrl,
        href: "/experiences",
      });
    }

    if (canLocal) {
      const restaurant = listRestaurants()[0];
      if (restaurant) {
        list.push({
          id: "dining",
          title: "Comer",
          subtitle: restaurant.name,
          imageUrl: restaurant.imageUrl,
          href: "/near/restaurants",
        });
      }
    }

    const signatureHub = explorerActivityHubs[0];
    if (signatureHub) {
      list.push({
        id: `hub-${signatureHub.slug}`,
        title: signatureHub.label,
        subtitle: "Club y comunidad",
        imageUrl: signatureHub.imageUrl,
        href: `/activities/${signatureHub.slug}`,
      });
    }

    const discoveryPlace = nearYou[0];
    if (discoveryPlace) {
      list.push({
        id: "discover",
        title: "Descubrir",
        subtitle: discoveryPlace.areaLabel,
        imageUrl: discoveryPlace.imageUrl,
        href: "/discover",
      });
    }

    return list.slice(0, 4);
  }, [canLocal, moments, nearYou]);

  const quickActions = useMemo(() => {
    const items = [
      {
        id: "today",
        label: "Qué pasa hoy",
        hint: "Momentos abiertos",
        icon: <LineIcon name="spark" />,
        onClick: () =>
          todaySectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
      },
    ];
    if (canExperiences) {
      items.push({
        id: "near-activities",
        label: "Actividades cerca",
        hint: "Esta semana",
        icon: <LineIcon name="pin" />,
        onClick: () => router.push("/experiences"),
      });
    }
    return items;
  }, [canExperiences, router]);

  const livingContext =
    moments.length > 0
      ? `${moments.length} ${moments.length === 1 ? "plan abierto" : "planes abiertos"}`
      : undefined;
  const tagline =
    moments.length > 0
      ? `${placeName} está viva hoy`
      : `Un día tranquilo en ${placeName}`;

  return (
    <div className="space-y-5 overflow-x-hidden pb-8 md:space-y-7">
      <TerritoryHero
        variant="belonging"
        tall
        imageUrl={theme.imagery.homeHero}
        imageAlt={territoryName}
        greeting={greeting}
        tagline={tagline}
        areaLabel={areaLine}
        contextLabel={livingContext}
        weatherLabel={weatherLabel}
      />

      <div className="space-y-8 md:space-y-9">
        {alerts.length > 0 ? (
          <section className="space-y-2" aria-label="Avisos de la comunidad">
            {alerts.map((alert) => {
              const tone = communityAlertTone(alert.level);
              const styles =
                tone === "alert"
                  ? {
                      card: "border-[color-mix(in_srgb,#B42318_42%,transparent)] bg-[#F8E8E6] shadow-[0_6px_20px_rgba(180,35,24,0.14)]",
                      emoji: "bg-[#F3D0CC]",
                      chip: "bg-[#F3D0CC] text-[#B42318]",
                    }
                  : tone === "important"
                    ? {
                        card: "border-[color-mix(in_srgb,#B8860B_45%,transparent)] bg-[#FBF3DC] shadow-[0_6px_20px_rgba(184,134,11,0.14)]",
                        emoji: "bg-[#F5E8C8]",
                        chip: "bg-[#F5E8C8] text-[#9A7209]",
                      }
                    : {
                        card: "border-[color-mix(in_srgb,#3D6B7A_40%,transparent)] bg-[#E8F1F4] shadow-[0_6px_20px_rgba(61,107,122,0.14)]",
                        emoji: "bg-[#D4E6EC]",
                        chip: "bg-[#D4E6EC] text-[#2F5562]",
                      };
              return (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() =>
                    router.push(alert.href ?? "/community?tab=actualidad")
                  }
                  className={`flex w-full items-start gap-3.5 rounded-[18px] border px-3.5 py-3.5 text-left transition-transform active:scale-[0.985] ${styles.card}`}
                >
                  <span
                    className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[28px] leading-none ${styles.emoji}`}
                    aria-hidden
                  >
                    {communityAlertIcon(alert.kind, alert.level)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[14px] font-bold uppercase tracking-[0.06em] ${styles.chip}`}
                    >
                      {communityAlertLevelLabel(alert.level)}
                    </span>
                    <span className="mt-1.5 block text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
                      {alert.title}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-5 text-[var(--color-text-secondary)]">
                      {[
                        alert.areaLabel
                          ? `Zona ${alert.areaLabel.replace(/^Zona\s+/i, "")}`
                          : null,
                        alert.timeWindowLabel,
                      ]
                        .filter(Boolean)
                        .join(" · ") || alert.contextLabel}
                    </span>
                    <span className="mt-2 flex items-center gap-0.5 text-[14px] font-semibold text-[var(--color-action-primary)]">
                      {alert.actionLabel ?? "Abrir"}
                      <LineIcon name="chevron" />
                    </span>
                  </span>
                </button>
              );
            })}
          </section>
        ) : null}

        <QuickActionBar items={quickActions} />

        <GlobalAppSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Buscar en ${placeName}`}
          hits={searchHits}
          onSelectHit={(hit) => {
            setSearchQuery("");
            router.push(hit.href);
          }}
        />

        {/* ── HOY — the heart of Home: open moments with real neighbours ── */}
        <div ref={todaySectionRef} className="scroll-mt-[72px]">
          <HomeSection
            atmospheric
            title={todayTitle}
            subtitle="Momentos abiertos ahora mismo."
            actionLabel={moments.length > 0 ? "Ver todos" : undefined}
            onAction={
              moments.length > 0 ? () => router.push("/experiences") : undefined
            }
          >
            {moments.length === 0 ? (
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
            ) : (
              <div className="space-y-4">
                {moments.map((moment) => {
                  const remaining = spotsLeft(moment);
                  const peopleLabel =
                    moment.participantCount > 0
                      ? `${moment.participantCount} vecinos van · ${remaining} plazas`
                      : `${remaining} plazas libres`;
                  return (
                    <ActivityCard
                      key={moment.id}
                      title={moment.title}
                      when={
                        live
                          ? formatExperienceWhen(moment.startsAt)
                          : experienceActivityLabel(moment.title)
                      }
                      where={moment.location}
                      badgeLabel={experienceActivityLabel(moment.title)}
                      peopleLabel={peopleLabel}
                      people={moment.participants}
                      imageUrl={moment.imageUrl}
                      ctaLabel={remaining > 0 ? "Unirme" : "Completo"}
                      secondaryCtaLabel="Ver plan"
                      onClick={() => router.push(`/experiences/${moment.id}`)}
                      onCta={() =>
                        router.push(
                          remaining > 0
                            ? `/experiences/${moment.id}/join`
                            : `/experiences/${moment.id}`,
                        )
                      }
                      onSecondaryCta={() =>
                        router.push(`/experiences/${moment.id}`)
                      }
                    />
                  );
                })}
              </div>
            )}
          </HomeSection>
        </div>

        {/* ── LA COMUNIDAD SE MUEVE — human activity, not a social feed ── */}
        {lifeFeatured ? (
          <HomeSection
            title="La comunidad se mueve"
            subtitle="Lo que están haciendo tus vecinos."
            actionLabel="Ver comunidad"
            onAction={() => router.push("/community")}
          >
            <div className="space-y-3">
              <CommunityActivityCard
                variant="featured"
                headline={lifeFeatured.narrative}
                context={lifeFeatured.context}
                imageUrl={lifeFeatured.imageUrl}
                personName={lifeFeatured.personName}
                personAvatarUrl={lifeFeatured.personAvatarUrl}
                onClick={() => router.push(lifeFeatured.href)}
              />
              {lifeRest.map((item) => (
                <CommunityActivityCard
                  key={item.id}
                  variant="compact"
                  headline={item.narrative}
                  context={item.context}
                  imageUrl={item.imageUrl}
                  personName={item.personName}
                  personAvatarUrl={item.personAvatarUrl}
                  onClick={() => router.push(item.href)}
                />
              ))}
            </div>
          </HomeSection>
        ) : null}

        {/* ── QUÉ PUEDES HACER HOY — photo doors, not a menu ── */}
        {doors.length > 0 ? (
          <HomeSection
            title="Qué puedes hacer hoy"
            subtitle="Tu comunidad, a un paso."
          >
            <div className="grid grid-cols-2 gap-3">
              {doors.map((door) => (
                <DiscoveryCard
                  key={door.id}
                  title={door.title}
                  subtitle={door.subtitle}
                  imageUrl={door.imageUrl}
                  badge={door.badge}
                  onClick={() => router.push(door.href)}
                />
              ))}
            </div>
          </HomeSection>
        ) : null}

        {/* ── CERCA DE TI — places the community points at ── */}
        {canLocal ? (
          <HomeSection
            title="Cerca de ti"
            subtitle="Lugares que la comunidad señala."
            actionLabel="Explorar"
            onAction={() => router.push("/discover")}
          >
            {nearYou.length === 0 ? (
              <EmptyState
                title="Aún no hay sitios cerca."
                description="Cuando la comunidad señale lugares, los verás aquí."
              />
            ) : (
              <LocalLifeRail>
                {nearYou.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    variant="immersive"
                    name={place.name}
                    categoryLabel={place.categoryLabel}
                    areaLabel={place.areaLabel}
                    blurb={place.story}
                    imageUrl={place.imageUrl}
                    recommendedBy={place.recommendedBy}
                    verified={place.verified}
                    trustNote={place.trustNote}
                    onClick={() => router.push(`/near/place/${place.id}`)}
                  />
                ))}
              </LocalLifeRail>
            )}
          </HomeSection>
        ) : null}
      </div>
    </div>
  );
}
