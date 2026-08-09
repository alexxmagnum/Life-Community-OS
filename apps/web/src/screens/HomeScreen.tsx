"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  buildForYouItems,
  buildTodayMoments,
  communityAlertIcon,
  communityAlertKindLabel,
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

function forYouGlyph(
  kind: "experience" | "local" | "welcome" | "proposal",
): ReactNode {
  if (kind === "welcome") return <LineIcon name="welcome" />;
  if (kind === "proposal") return <LineIcon name="notice" />;
  if (kind === "local") return <LineIcon name="pin" />;
  return <LineIcon name="spark" />;
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

const DO_TODAY_CHIPS: ReadonlyArray<{
  id: string;
  icon: "golf" | "dining" | "sports" | "events" | "family";
  label: string;
  href: string;
}> = [
  { id: "golf", icon: "golf", label: "Golf", href: "/experiences" },
  { id: "dining", icon: "dining", label: "Restaurantes", href: "/near/restaurants" },
  { id: "sports", icon: "sports", label: "Deportes", href: "/experiences" },
  { id: "events", icon: "events", label: "Eventos", href: "/community?tab=actualidad" },
  { id: "family", icon: "family", label: "Familias", href: "/experiences" },
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

  useEffect(() => {
    setLive(true);
    setGreeting(belongingGreeting(demoMember.displayName, madridHour()));
  }, [demoMember.displayName]);

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
        limit: 3,
        excludeKinds: ["experience"],
        ...frontDoorOpts,
      }),
    [demoMember, frontDoorOpts],
  );

  const todaySquare = useMemo(() => {
    const moments = buildTodayMoments({ limit: 3, ...frontDoorOpts }).map(
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
    const stories = buildCommunityLifeItems({ limit: 3 }).map((item) => ({
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
    const unique = merged.filter((item) => {
      const key = item.title.slice(0, 48);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const withPhoto = unique.find((item) => item.imageUrl);
    const featured = withPhoto ?? unique[0] ?? null;
    const secondary = unique
      .filter((item) => item.id !== featured?.id)
      .slice(0, 2);

    return { featured, secondary };
  }, [frontDoorOpts]);

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
        {/* ── PARA TI — personal relevance ── */}
        <HomeSection title="Para ti" subtitle="Lo que importa para ti hoy.">
          {alerts.length === 0 && forYou.length === 0 ? (
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando haya avisos relevantes, los verás aquí."
            />
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() =>
                    router.push(alert.href ?? "/community?tab=actualidad")
                  }
                  className="flex w-full items-start gap-3 rounded-[18px] border border-[color-mix(in_srgb,var(--color-warning)_45%,transparent)] bg-[var(--color-warning-subtle,#FBF3DC)] px-3.5 py-3.5 text-left shadow-[0_6px_20px_rgba(184,134,11,0.12)] transition-transform active:scale-[0.985]"
                >
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-warning)_18%,white)] text-[17px]"
                    aria-hidden
                  >
                    {communityAlertIcon(alert.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-warning)_16%,white)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-warning)]">
                      Alerta
                    </span>
                    <span className="mt-1.5 block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {alert.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-secondary)]">
                      {alert.contextLabel}
                    </span>
                    <span className="sr-only">
                      {communityAlertKindLabel(alert.kind)}
                    </span>
                  </span>
                  <span className="mt-2 flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[var(--color-action-primary)]">
                    Abrir
                    <LineIcon name="chevron" />
                  </span>
                </button>
              ))}

              {forYou.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(26,31,28,0.04)] transition-transform active:scale-[0.99]"
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]">
                      {forYouGlyph(item.kind)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-tertiary)]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </HomeSection>

        {/* ── HOY — community square (heart) ── */}
        <HomeSection
          atmospheric
          title={todayTitle}
          subtitle="La plaza de tu comunidad."
          actionLabel="Ver comunidad"
          onAction={() => router.push("/community")}
        >
          {!todaySquare.featured ? (
            <EmptyState
              title="Hoy está tranquilo por aquí."
              description="Cuando haya planes o historias, aparecerán aquí."
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
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => router.push(todaySquare.featured!.href)}
                className="group w-full overflow-hidden rounded-[22px] text-left shadow-[0_10px_28px_rgba(26,31,28,0.10)] transition-transform active:scale-[0.985]"
              >
                <div className="relative aspect-[16/10] bg-[var(--color-surface-muted)]">
                  {todaySquare.featured.imageUrl ? (
                    <ZoomableImage
                      src={todaySquare.featured.imageUrl}
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
                    {todaySquare.featured.personName ? (
                      <span className="mb-1.5 flex items-center gap-2">
                        {todaySquare.featured.personAvatarUrl ? (
                          <span className="h-6 w-6 overflow-hidden rounded-full">
                            <ZoomableImage
                              src={todaySquare.featured.personAvatarUrl}
                              alt=""
                              wrapperClassName="h-full w-full"
                            />
                          </span>
                        ) : null}
                        <span className="text-[12px] font-medium text-white/85">
                          {todaySquare.featured.personName}
                        </span>
                      </span>
                    ) : null}
                    <span className="block font-display text-[20px] font-semibold leading-6 text-white sm:text-[22px]">
                      {todaySquare.featured.title}
                    </span>
                    <span className="mt-1 block truncate text-[13px] text-white/80">
                      {todaySquare.featured.context}
                    </span>
                  </div>
                </div>
              </button>

              {todaySquare.secondary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(26,31,28,0.04)] transition-transform active:scale-[0.99]"
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-surface-muted)] text-[var(--color-action-primary)]">
                      <LineIcon name="notice" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-tertiary)]">
                      {item.context}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </HomeSection>

        {/* ── QUÉ PUEDES HACER HOY — photo discovery ── */}
        {isFeatureEnabled("experiences") ? (
          <HomeSection
            title="Qué puedes hacer hoy"
            subtitle="Planes y encuentros cerca."
            actionLabel="Ver todas"
            onAction={() => router.push("/experiences")}
          >
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {DO_TODAY_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => router.push(chip.href)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3.5 py-2.5 text-left text-[var(--color-action-primary)] shadow-[0_1px_2px_rgba(26,31,28,0.04)] transition-transform active:scale-[0.98]"
                >
                  <LineIcon name={chip.icon} />
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                    {chip.label}
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
                title="Todavía no hay planes abiertos."
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
                    onClick={() => {
                      if (
                        place.kind === "restaurant" ||
                        place.kind === "cafe"
                      ) {
                        router.push("/near/restaurants");
                      } else if (place.kind === "shop") {
                        router.push("/near/businesses");
                      } else if (place.kind === "service") {
                        router.push("/near/services");
                      } else {
                        router.push("/near/places");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-2 pr-3 text-left shadow-[0_2px_10px_rgba(26,31,28,0.05)] transition-transform active:scale-[0.99]"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-surface-muted)]">
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
                      <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-tertiary)]">
                        {place.categoryLabel}
                        {place.areaLabel ? ` · ${place.areaLabel}` : ""}
                      </span>
                      <span className="mt-1 block truncate text-[12px] font-medium text-[var(--color-action-primary)]">
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
