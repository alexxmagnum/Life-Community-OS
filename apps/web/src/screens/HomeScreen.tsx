"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  buildForYouItems,
  buildTodayMoments,
  communityAlertIcon,
  communityAlertLevelLabel,
  communityAlertTone,
  experienceActivityLabel,
  formatExperienceWhen,
  listActiveCommunityAlerts,
  listCuratedNearYou,
  listUpcomingHomeExperiences,
  searchHomeCatalog,
  spotsLeft,
  territoryDiscoveryAreaLabels,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  ExperiencePreviewCard,
  GlobalAppSearch,
  HomeSection,
  TerritoryHero,
  ZoomableImage,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

function belongingGreeting(name: string, hour: number): string {
  const salutation =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  return `${salutation} ${name}`;
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
  name:
    | "notice"
    | "welcome"
    | "pin"
    | "spark"
    | "golf"
    | "dining"
    | "sports"
    | "events"
    | "family"
    | "chevron";
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
    case "notice":
      return (
        <svg {...common}>
          <path
            d="M12 4v11M12 18.5h.01"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "welcome":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4.5 18.5c.8-2.6 2.8-4 4.5-4s3.6 1.2 4.4 3.4M13.2 14.8c.7-.4 1.6-.6 2.6-.6 1.7 0 3.3 1 4 3.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
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
    case "golf":
      return (
        <svg {...common}>
          <path
            d="M8 20.5h8M12 20.5V8.5M12 8.5l6-3v5l-6-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "dining":
      return (
        <svg {...common}>
          <path
            d="M7 4v7a2 2 0 0 0 2 2v7M7 4c0 2 .8 3.5 2 4M17 4v16M17 4c-1.5 1.2-2 3-2 5v2h2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sports":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 4.5v15M4.5 12h15M7.2 7.2c2.2 1.4 7.4 1.4 9.6 0M7.2 16.8c2.2-1.4 7.4-1.4 9.6 0"
            stroke="currentColor"
            strokeWidth="1.35"
          />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <rect
            x="4"
            y="6"
            width="16"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 4v4M16 4v4M4 11h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "family":
      return (
        <svg {...common}>
          <circle cx="8.5" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="15.5" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4.2 18.5c.6-2.4 2.2-3.6 4.3-3.6 1.6 0 2.9.7 3.7 2M12.8 15.4c.6-.3 1.3-.5 2.2-.5 1.8 0 3.3 1 4 3.1"
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

function forYouEmoji(
  kind: "experience" | "local" | "welcome" | "proposal",
): string {
  if (kind === "welcome") return "👋";
  if (kind === "proposal") return "📢";
  if (kind === "local") return "📍";
  return "✨";
}

function nearDiscoveryReason(place: {
  recommendedBy?: string;
  verified?: boolean;
  areaLabel: string;
  story: string;
}): string {
  if (place.recommendedBy) return `Recomendado por ${place.recommendedBy}`;
  if (place.verified) return "Popular esta semana";
  if (place.story?.trim()) {
    const short = place.story.trim().slice(0, 42);
    return short.length < place.story.trim().length ? `${short}…` : short;
  }
  return `Cerca · ${place.areaLabel}`;
}

/** Three clear discovery doors — curated emoji, tinted cards. */
const DO_TODAY_DOORS: ReadonlyArray<{
  id: string;
  emoji: string;
  label: string;
  hint: string;
  href: string;
  tint: string;
  card: string;
  shadow: string;
}> = [
  {
    id: "experiences",
    emoji: "✨",
    label: "Experiencias",
    hint: "Encuentros y actividades",
    href: "/experiences",
    tint: "bg-[#DCEEE4]",
    card: "bg-[#F3FAF6] border border-[#C5DED0]",
    shadow: "shadow-[0_8px_22px_rgba(31,74,60,0.14)]",
  },
  {
    id: "dining",
    emoji: "🍽️",
    label: "Restaurantes",
    hint: "Comer cerca",
    href: "/near/restaurants",
    tint: "bg-[#F8E0CC]",
    card: "bg-[#FFF7F0] border border-[#EED4BC]",
    shadow: "shadow-[0_8px_22px_rgba(196,122,58,0.16)]",
  },
  {
    id: "sports",
    emoji: "🎾",
    label: "Deportes",
    hint: "Golf, pádel…",
    href: "/activities/golf",
    tint: "bg-[#D7E8F4]",
    card: "bg-[#F2F8FC] border border-[#C5D9E8]",
    shadow: "shadow-[0_8px_22px_rgba(61,107,122,0.15)]",
  },
];

const HYDRATE_SAFE = {
  includeSessionExperiences: false,
  stabilizeTime: true,
} as const;

const LIVE_OPTS = {
  includeSessionExperiences: true,
  stabilizeTime: false,
} as const;

/**
 * Home = open the window to Panorámica.
 * Hierarchy: alert → featured moment → secondary previews → photo discovery.
 */
export function HomeScreen() {
  const router = useRouter();
  const {
    theme,
    isFeatureEnabled,
    hasCapability,
    demoMember,
    demoPersonId,
  } = useTenant();

  const [live, setLive] = useState(false);
  const [greeting, setGreeting] = useState(
    () => `Hola ${demoMember.displayName}`,
  );
  const [searchQuery, setSearchQuery] = useState("");
  /** Collapsed by default — peek + unwrap rest in batches of 5. */
  const PAGE = 5;
  const [forYouOpen, setForYouOpen] = useState(false);
  const [forYouVisibleCount, setForYouVisibleCount] = useState(PAGE);
  const [todayOpen, setTodayOpen] = useState(false);
  const [todayVisibleCount, setTodayVisibleCount] = useState(PAGE);
  const forYouSectionRef = useRef<HTMLElement | null>(null);
  const todaySectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setLive(true);
    setGreeting(belongingGreeting(demoMember.displayName, madridHour()));
  }, [demoMember.displayName]);

  /** Collapse open accordions when tapping outside. */
  useEffect(() => {
    if (!forYouOpen && !todayOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        forYouOpen &&
        forYouSectionRef.current &&
        !forYouSectionRef.current.contains(target)
      ) {
        setForYouOpen(false);
        setForYouVisibleCount(PAGE);
      }
      if (
        todayOpen &&
        todaySectionRef.current &&
        !todaySectionRef.current.contains(target)
      ) {
        setTodayOpen(false);
        setTodayVisibleCount(PAGE);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [forYouOpen, todayOpen]);

  const searchHits = useMemo(
    () => searchHomeCatalog(searchQuery, 8),
    [searchQuery],
  );

  const territoryName = theme.identity?.territoryName ?? theme.logoText;
  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    territoryName,
  );
  const areaLine =
    demoMember.areaLabel || theme.identity?.defaultAreaName || undefined;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  const frontDoorOpts = live ? LIVE_OPTS : HYDRATE_SAFE;

  const alerts = useMemo(() => {
    const nowMs = live
      ? Date.now()
      : Date.parse("2026-08-09T12:00:00.000Z");
    return listActiveCommunityAlerts(nowMs);
  }, [live]);

  /** Hide stub weather when an exceptional alert is active — avoid double climate story. */
  const weatherLabel =
    alerts.length > 0 ? undefined : theme.identity?.weatherLabel;

  /** Personal relevance only — experiences live in discovery. */
  const forYou = useMemo(
    () =>
      buildForYouItems(demoMember, {
        limit: 15,
        excludeKinds: ["experience"],
        ...frontDoorOpts,
      }),
    [demoMember, frontDoorOpts],
  );
  const forYouVisible = forYou.slice(0, forYouVisibleCount);
  const forYouHiddenCount = Math.max(0, forYou.length - forYouVisibleCount);
  const forYouPeek = forYou[0];

  const todayItems = useMemo(() => {
    const moments = buildTodayMoments({ limit: 8, ...frontDoorOpts }).map(
      (moment) => ({
        id: moment.id,
        title: moment.title,
        context: moment.meta,
        href: moment.href,
        imageUrl: moment.imageUrl,
        personName: undefined as string | undefined,
        personAvatarUrl: undefined as string | undefined,
      }),
    );
    const stories = buildCommunityLifeItems({ limit: 8 }).map((item) => ({
      id: item.id,
      title: item.narrative,
      context: item.context ?? item.personName ?? "Comunidad",
      href: item.href,
      imageUrl: item.imageUrl,
      personName: item.personName,
      personAvatarUrl: item.personAvatarUrl,
    }));

    const merged = [...stories, ...moments];
    const seen = new Set<string>();
    return merged.filter((item) => {
      const key = item.title.slice(0, 48);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [frontDoorOpts]);

  const todayVisible = todayItems.slice(0, todayVisibleCount);
  const todayFeatured =
    todayVisible.find((item) => item.imageUrl) ?? todayVisible[0] ?? null;
  const todayRest = todayVisible.filter((item) => item.id !== todayFeatured?.id);
  const todayHiddenCount = Math.max(0, todayItems.length - todayVisibleCount);
  const todayPeek = todayItems[0] ?? null;
  const experiences = useMemo(() => {
    if (!isFeatureEnabled("experiences")) return [];
    if (!hasCapability(CAPABILITIES.experienceView)) return [];
    return listUpcomingHomeExperiences({ limit: 5, ...frontDoorOpts });
  }, [isFeatureEnabled, hasCapability, frontDoorOpts]);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listCuratedNearYou(demoMember, {
      limit: 3,
      preferredAreaLabels: territoryDiscoveryAreaLabels(demoPersonId),
    });
  }, [canLocal, demoMember, demoPersonId]);

  return (
    <div className="space-y-5 overflow-x-hidden pb-8 md:space-y-7">
      <TerritoryHero
        variant="belonging"
        imageUrl={theme.imagery.homeHero}
        imageAlt={territoryName}
        greeting={greeting}
        areaLabel={areaLine}
        weatherLabel={weatherLabel}
        searchSlot={
          <GlobalAppSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Buscar en ${territoryName}`}
            hits={searchHits}
            onSelectHit={(hit) => {
              setSearchQuery("");
              router.push(hit.href);
            }}
          />
        }
      />

      <div className="space-y-8 pt-0.5 md:space-y-9">
        {/* ── PARA TI — accordion; 3 visibles, resto envuelto ── */}
        {alerts.length === 0 && forYou.length === 0 ? (
          <HomeSection title="Para ti" subtitle="Lo que importa para ti hoy.">
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando haya avisos relevantes, los verás aquí."
            />
          </HomeSection>
        ) : (
          <section
            ref={forYouSectionRef}
            className="overflow-hidden rounded-[18px] border border-[#E8E2D8] bg-[#FFFCFA] shadow-[0_6px_18px_rgba(26,31,28,0.08)]"
          >
            <button
              type="button"
              onClick={() =>
                setForYouOpen((open) => {
                  if (open) setForYouVisibleCount(PAGE);
                  return !open;
                })
              }
              aria-expanded={forYouOpen}
              className="flex w-full items-start justify-between gap-3 px-4 pb-2 pt-3.5 text-left"
            >
              <div className="min-w-0">
                <h2 className="font-sans text-[20px] font-semibold leading-7 tracking-tight text-[var(--color-text-primary)] sm:text-[21px]">
                  Para ti
                </h2>
                <p className="mt-1 text-[15px] leading-5 text-[var(--color-text-tertiary)]">
                  Lo que importa para ti hoy.
                </p>
              </div>
              <span
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)] transition-transform duration-200 ${
                  forYouOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {alerts.length > 0 ? (
              <div className="space-y-2 border-t border-[var(--color-border-subtle)] px-3 pb-2 pt-2">
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
                        <span className="mt-1.5 block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                          {alert.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[14px] text-[var(--color-text-secondary)]">
                          {alert.contextLabel}
                        </span>
                      </span>
                      <span className="mt-2 flex shrink-0 items-center gap-0.5 text-[14px] font-semibold text-[var(--color-action-primary)]">
                        Abrir
                        <LineIcon name="chevron" />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!forYouOpen ? (
              forYouPeek ? (
                <div className="border-t border-[var(--color-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setForYouOpen(true)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-black/[0.02]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
                        {forYouPeek.title}
                      </span>
                      {forYouPeek.subtitle ? (
                        <span className="mt-0.5 block truncate text-[15px] leading-4 text-[var(--color-text-secondary)]">
                          {forYouPeek.subtitle}
                        </span>
                      ) : null}
                    </span>
                    {forYou.length > 1 ? (
                      <span className="shrink-0 text-[14px] font-semibold text-[var(--color-action-primary)]">
                        +{forYou.length - 1}
                      </span>
                    ) : null}
                  </button>
                </div>
              ) : null
            ) : forYou.length > 0 ? (
              <div className="space-y-2 border-t border-[var(--color-border-subtle)] px-3 pb-3.5 pt-2">
                {forYouVisible.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="flex w-full items-center gap-3 rounded-[14px] border border-[#E8E2D8] bg-white px-3 py-2.5 text-left shadow-[0_4px_14px_rgba(26,31,28,0.08)] transition-transform active:scale-[0.99]"
                  >
                    {item.imageUrl ? (
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-muted)]">
                        <ZoomableImage
                          src={item.imageUrl}
                          alt=""
                          wrapperClassName="h-full w-full"
                        />
                      </span>
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-action-primary-subtle)] text-[22px] leading-none">
                        {forYouEmoji(item.kind)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {item.title}
                      </span>
                      {item.subtitle ? (
                        <span className="mt-0.5 block truncate text-[14px] text-[var(--color-text-tertiary)]">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
                {forYouHiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForYouVisibleCount((n) => n + PAGE)
                    }
                    className="w-full rounded-[12px] py-2 text-center text-[15px] font-semibold text-[var(--color-action-primary)]"
                  >
                    Ver {Math.min(PAGE, forYouHiddenCount)} más
                  </button>
                ) : forYouVisibleCount > PAGE ? (
                  <button
                    type="button"
                    onClick={() => setForYouVisibleCount(PAGE)}
                    className="w-full rounded-[12px] py-2 text-center text-[15px] font-semibold text-[var(--color-action-primary)]"
                  >
                    Mostrar menos
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

        {/* ── HOY — accordion; 3 visibles, resto envuelto ── */}
        {!todayFeatured ? (
          <HomeSection
            atmospheric
            title={todayTitle}
            subtitle="La plaza de tu comunidad."
            actionLabel="Ver comunidad"
            onAction={() => router.push("/community")}
          >
            <EmptyState
              title="Hoy está tranquilo por aquí."
              description="Cuando haya experiencias o historias, aparecerán aquí."
              actionLabel={
                hasCapability(CAPABILITIES.experienceCreate)
                  ? "Crear experiencia"
                  : undefined
              }
              onAction={
                hasCapability(CAPABILITIES.experienceCreate)
                  ? () => router.push("/experiences/create")
                  : undefined
              }
            />
          </HomeSection>
        ) : (
          <section
            ref={todaySectionRef}
            className="overflow-hidden rounded-[18px] border border-[#E8E2D8] bg-[#FFFCFA] shadow-[0_6px_18px_rgba(26,31,28,0.08)]"
          >
            <button
              type="button"
              onClick={() =>
                setTodayOpen((open) => {
                  if (open) setTodayVisibleCount(PAGE);
                  return !open;
                })
              }
              aria-expanded={todayOpen}
              className="flex w-full items-start justify-between gap-3 px-4 pb-2 pt-3.5 text-left"
            >
              <div className="min-w-0">
                <h2 className="font-sans text-[21px] font-semibold leading-7 tracking-tight text-[var(--color-text-primary)] sm:text-[22px]">
                  {todayTitle}
                </h2>
                <p className="mt-1 text-[15px] leading-5 text-[var(--color-text-tertiary)]">
                  La plaza de tu comunidad.
                </p>
              </div>
              <span
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)] transition-transform duration-200 ${
                  todayOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {!todayOpen ? (
              <div className="border-t border-[var(--color-border-subtle)]">
                {todayPeek ? (
                  <button
                    type="button"
                    onClick={() => setTodayOpen(true)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-black/[0.02]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
                        {todayPeek.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[15px] leading-4 text-[var(--color-text-secondary)]">
                        {todayPeek.context}
                      </span>
                    </span>
                    {todayItems.length > 1 ? (
                      <span className="shrink-0 text-[14px] font-semibold text-[var(--color-action-primary)]">
                        +{todayItems.length - 1}
                      </span>
                    ) : null}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2.5 border-t border-[var(--color-border-subtle)] px-3 pb-3.5 pt-2">
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => router.push("/community")}
                    className="text-[15px] font-semibold text-[var(--color-action-primary)]"
                  >
                    Ver comunidad ›
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(todayFeatured.href)}
                  className="group w-full overflow-hidden rounded-[22px] text-left shadow-[0_14px_36px_rgba(26,31,28,0.16)] ring-1 ring-black/5 transition-transform active:scale-[0.985]"
                >
                  <div className="relative aspect-[16/10] bg-[var(--color-surface-muted)]">
                    {todayFeatured.imageUrl ? (
                      <ZoomableImage
                        src={todayFeatured.imageUrl}
                        alt=""
                        className="transition-transform duration-700 group-active:scale-[1.02]"
                        wrapperClassName="h-full w-full"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]">
                        <LineIcon name="spark" className="h-8 w-8" />
                      </div>
                    )}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(transparent 35%, rgba(20,28,24,0.78))",
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      {todayFeatured.personName ? (
                        <span className="mb-1.5 flex items-center gap-2">
                          {todayFeatured.personAvatarUrl ? (
                            <span className="h-6 w-6 overflow-hidden rounded-full">
                              <ZoomableImage
                                src={todayFeatured.personAvatarUrl}
                                alt=""
                                wrapperClassName="h-full w-full"
                              />
                            </span>
                          ) : null}
                          <span className="text-[14px] font-medium text-white/85">
                            {todayFeatured.personName}
                          </span>
                        </span>
                      ) : null}
                      <span className="block font-sans text-[18px] font-semibold leading-6 tracking-tight text-white sm:text-[20px]">
                        {todayFeatured.title}
                      </span>
                      <span className="mt-1 block truncate text-[15px] text-white/80">
                        {todayFeatured.context}
                      </span>
                    </div>
                  </div>
                </button>

                {todayRest.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="flex w-full items-center gap-3 rounded-[14px] border border-[#E8E2D8] bg-white px-3 py-2.5 text-left shadow-[0_4px_14px_rgba(26,31,28,0.08)] transition-transform active:scale-[0.99]"
                  >
                    {item.imageUrl ? (
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-muted)]">
                        <ZoomableImage
                          src={item.imageUrl}
                          alt=""
                          wrapperClassName="h-full w-full"
                        />
                      </span>
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-surface-muted)] text-[22px] leading-none">
                        📢
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[14px] text-[var(--color-text-tertiary)]">
                        {item.context}
                      </span>
                    </span>
                  </button>
                ))}

                {todayHiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setTodayVisibleCount((n) => n + PAGE)
                    }
                    className="w-full rounded-[12px] py-2 text-center text-[15px] font-semibold text-[var(--color-action-primary)]"
                  >
                    Ver {Math.min(PAGE, todayHiddenCount)} más
                  </button>
                ) : todayVisibleCount > PAGE ? (
                  <button
                    type="button"
                    onClick={() => setTodayVisibleCount(PAGE)}
                    className="w-full rounded-[12px] py-2 text-center text-[15px] font-semibold text-[var(--color-action-primary)]"
                  >
                    Mostrar menos
                  </button>
                ) : null}
              </div>
            )}
          </section>
        )}

        {/* ── QUÉ PUEDES HACER HOY — photo discovery ── */}
        {isFeatureEnabled("experiences") ? (
          <HomeSection
            title="Qué puedes hacer hoy"
            subtitle="Experiencias y encuentros cerca."
            actionLabel="Ver todas"
            onAction={() => router.push("/experiences")}
          >
            <div className="grid grid-cols-3 gap-2.5">
              {DO_TODAY_DOORS.map((door) => (
                <button
                  key={door.id}
                  type="button"
                  onClick={() => router.push(door.href)}
                  className={`flex flex-col items-center gap-2 rounded-[18px] px-2 py-3.5 text-center transition-transform active:scale-[0.97] ${door.card} ${door.shadow}`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-[28px] leading-none shadow-[0_2px_8px_rgba(26,31,28,0.08)] ${door.tint}`}
                    aria-hidden
                  >
                    {door.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold leading-4 text-[var(--color-text-primary)]">
                      {door.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] leading-3 text-[var(--color-text-tertiary)]">
                      {door.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {experiences.length > 0 ? (
              <div className="-mx-1 mt-3.5 flex gap-3.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {experiences.map((exp) => {
                  const remaining = spotsLeft(exp);
                  return (
                    <div
                      key={exp.id}
                      className="w-[min(58vw,200px)] shrink-0"
                    >
                      <ExperiencePreviewCard
                        title={exp.title}
                        when={
                          live
                            ? formatExperienceWhen(exp.startsAt)
                            : experienceActivityLabel(exp.title)
                        }
                        where={exp.location}
                        imageUrl={exp.imageUrl}
                        categoryLabel={experienceActivityLabel(exp.title)}
                        peopleLabel={
                          exp.participantCount > 0
                            ? `${exp.participantCount} van · ${remaining} plazas`
                            : `${remaining} plazas`
                        }
                        onClick={() => router.push(`/experiences/${exp.id}`)}
                        ctaLabel={undefined}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Todavía no hay experiencias abiertas."
                description="Sé la primera persona en proponer algo."
                actionLabel={
                  hasCapability(CAPABILITIES.experienceCreate)
                    ? "Crear experiencia"
                    : undefined
                }
                onAction={
                  hasCapability(CAPABILITIES.experienceCreate)
                    ? () => router.push("/experiences/create")
                    : undefined
                }
              />
            )}
          </HomeSection>
        ) : null}

        {/* ── CERCA DE TI — discovery, not directory ── */}
        {canLocal ? (
          <HomeSection
            title="Cerca de ti"
            subtitle="Lugares que la comunidad señala."
            actionLabel="Explorar"
            onAction={() => router.push("/near/restaurants")}
          >
            {nearYou.length === 0 ? (
              <EmptyState
                title="Aún no hay sitios cerca."
                description="Cuando la comunidad señale lugares, los verás aquí."
              />
            ) : (
              <div className="space-y-2.5">
                {nearYou.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => router.push(`/near/place/${place.id}`)}
                    className="flex w-full items-center gap-3 rounded-[16px] border border-[#E8E2D8] bg-[#FFFCFA] p-2 pr-3 text-left shadow-[0_6px_18px_rgba(26,31,28,0.10)] transition-transform active:scale-[0.99]"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-surface-muted)] shadow-[0_2px_8px_rgba(26,31,28,0.08)]">
                      <ZoomableImage
                        src={place.imageUrl}
                        alt=""
                        wrapperClassName="h-full w-full"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {place.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[14px] text-[var(--color-text-tertiary)]">
                        {place.categoryLabel}
                        {place.areaLabel ? ` · ${place.areaLabel}` : ""}
                      </span>
                      <span className="mt-1 block truncate text-[14px] font-medium text-[var(--color-action-primary)]">
                        {nearDiscoveryReason(place)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </HomeSection>
        ) : null}
      </div>
    </div>
  );
}
