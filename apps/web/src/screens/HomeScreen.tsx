"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  buildForYouItems,
  buildTodayMoments,
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
  AuthorCard,
  CommunityActivityCard,
  EmptyState,
  ExperiencePreviewCard,
  GlobalAppSearch,
  HomeSection,
  LocalLifeRail,
  LocalPlaceCard,
  TerritoryHero,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

/** Belonging greeting — Spanish product copy; i18n catalogue later. */
function belongingGreeting(name: string, hour: number): string {
  const salutation =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  return `${salutation} ${name}`;
}

/** Stable hour in Europe/Madrid. */
function madridHour(nowMs = Date.now()): number {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).format(new Date(nowMs));
  return Number(hourStr);
}

function forYouCategoryLabel(
  kind: "experience" | "local" | "welcome" | "proposal",
): string {
  if (kind === "experience") return "Para ti";
  if (kind === "welcome") return "Bienvenida";
  if (kind === "proposal") return "Aviso";
  return "Cerca";
}

/** Shared first-paint options — identical on server and client hydrate. */
const HYDRATE_SAFE = {
  includeSessionExperiences: false,
  stabilizeTime: true,
} as const;

const LIVE_OPTS = {
  includeSessionExperiences: true,
  stabilizeTime: false,
} as const;

/**
 * Home = digital plaza of the community.
 * "What is happening today in my community?"
 * Property / residency / territory access stay internal for relevance — not Home UI.
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
  /** Para ti / Hoy start collapsed — peek + expand. */
  const [forYouOpen, setForYouOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);

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
  /** Soft place line — not residency/property product UI. */
  const areaLine =
    demoMember.areaLabel || theme.identity?.defaultAreaName || undefined;
  const weatherLabel = theme.identity?.weatherLabel;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  const frontDoorOpts = live ? LIVE_OPTS : HYDRATE_SAFE;

  const alerts = useMemo(() => {
    const nowMs = live
      ? Date.now()
      : Date.parse("2026-08-09T12:00:00.000Z");
    return listActiveCommunityAlerts(nowMs);
  }, [live]);

  const forYou = useMemo(
    () => buildForYouItems(demoMember, { limit: 5, ...frontDoorOpts }),
    [demoMember, frontDoorOpts],
  );
  const forYouPeek = forYou[forYou.length - 1];

  const today = useMemo(
    () => buildTodayMoments({ limit: 5, ...frontDoorOpts }),
    [frontDoorOpts],
  );

  const communityLife = useMemo(
    () => buildCommunityLifeItems({ limit: 4 }),
    [],
  );

  const todaySquareCount = today.length + communityLife.length;
  const todayPeek = today[0]
    ? { title: today[0].title, subtitle: today[0].meta }
    : communityLife[0]
      ? {
          title: communityLife[0].narrative,
          subtitle: communityLife[0].context ?? communityLife[0].personName,
        }
      : null;

  const experiences = useMemo(() => {
    if (!isFeatureEnabled("experiences")) return [];
    if (!hasCapability(CAPABILITIES.experienceView)) return [];
    return listUpcomingHomeExperiences({ limit: 6, ...frontDoorOpts });
  }, [isFeatureEnabled, hasCapability, frontDoorOpts]);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listCuratedNearYou(demoMember, {
      limit: 4,
      preferredAreaLabels: territoryDiscoveryAreaLabels(demoPersonId),
    });
  }, [canLocal, demoMember, demoPersonId]);

  return (
    <div className="space-y-6 overflow-x-hidden pb-8 md:space-y-8">
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

      <div className="space-y-8 pt-1 md:space-y-10">
        {/* PARA TI — alerts always visible; personalized list is collapsible */}
        {forYou.length === 0 && alerts.length === 0 ? (
          <HomeSection
            title="Para ti"
            subtitle="Lo relevante para tu día en la comunidad."
          >
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando haya avisos, planes o recomendaciones para ti, los verás aquí."
            />
          </HomeSection>
        ) : (
          <section className="overflow-hidden rounded-[18px] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
            <button
              type="button"
              onClick={() => setForYouOpen((open) => !open)}
              aria-expanded={forYouOpen}
              className="flex w-full items-start justify-between gap-3 px-4 pb-2 pt-3.5 text-left"
            >
              <div className="min-w-0">
                <h2 className="font-display text-[22px] font-semibold leading-7 tracking-tight text-[var(--color-text-primary)] sm:text-[24px]">
                  Para ti
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-tertiary)]">
                  Lo relevante para tu día en la comunidad.
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
                {alerts.map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    onClick={() =>
                      router.push(alert.href ?? "/community?tab=actualidad")
                    }
                    className="w-full rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-surface-elevated))] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)]"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-warning)]">
                      {communityAlertKindLabel(alert.kind)}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                      {alert.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
                      {alert.body}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Collapsed peek — full cards on expand */}
            {!forYouOpen ? (
              forYou.length > 0 ? (
                <div className="border-t border-[var(--color-border-subtle)]">
                  {forYouPeek ? (
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
                          <span className="mt-0.5 block truncate text-[13px] leading-4 text-[var(--color-text-secondary)]">
                            {forYouPeek.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {forYou.length > 1 ? (
                        <span className="shrink-0 text-[12px] font-semibold text-[var(--color-action-primary)]">
                          +{forYou.length - 1}
                        </span>
                      ) : null}
                    </button>
                  ) : null}
                </div>
              ) : null
            ) : forYou.length > 0 ? (
              <div className="space-y-3 border-t border-[var(--color-border-subtle)] px-3 pb-3.5 pt-2">
                {forYou.map((item) => (
                  <CommunityActivityCard
                    key={item.id}
                    variant="compact"
                    categoryLabel={forYouCategoryLabel(item.kind)}
                    headline={item.title}
                    context={item.subtitle}
                    imageUrl={item.imageUrl}
                    actionLabel="Abrir"
                    onClick={() => router.push(item.href)}
                    onAction={() => router.push(item.href)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        )}

        {/* HOY EN {territory} — community square, same collapsible as Para ti */}
        {todaySquareCount === 0 ? (
          <HomeSection
            title={todayTitle}
            subtitle="Qué está pasando en tu lugar hoy."
            actionLabel="Ver comunidad"
            onAction={() => router.push("/community")}
          >
            <EmptyState
              title="Hoy está tranquilo por aquí."
              description="Cuando haya planes, avisos o historias de vecinos, aparecerán aquí."
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
          <section className="overflow-hidden rounded-[18px] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
            <button
              type="button"
              onClick={() => setTodayOpen((open) => !open)}
              aria-expanded={todayOpen}
              className="flex w-full items-start justify-between gap-3 px-4 pb-2 pt-3.5 text-left"
            >
              <div className="min-w-0">
                <h2 className="font-display text-[22px] font-semibold leading-7 tracking-tight text-[var(--color-text-primary)] sm:text-[24px]">
                  {todayTitle}
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-tertiary)]">
                  Qué está pasando en tu lugar hoy.
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
                      {todayPeek.subtitle ? (
                        <span className="mt-0.5 block truncate text-[13px] leading-4 text-[var(--color-text-secondary)]">
                          {todayPeek.subtitle}
                        </span>
                      ) : null}
                    </span>
                    {todaySquareCount > 1 ? (
                      <span className="shrink-0 text-[12px] font-semibold text-[var(--color-action-primary)]">
                        +{todaySquareCount - 1}
                      </span>
                    ) : null}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3 border-t border-[var(--color-border-subtle)] px-3 pb-3.5 pt-2">
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={() => router.push("/community")}
                    className="text-[13px] font-semibold text-[var(--color-action-primary)]"
                  >
                    Ver comunidad
                  </button>
                </div>
                {today.map((moment) => (
                  <button
                    key={moment.id}
                    type="button"
                    onClick={() => router.push(moment.href)}
                    className="flex w-full gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3.5 text-left"
                  >
                    <div className="w-14 shrink-0">
                      <p className="text-[13px] font-bold text-[var(--color-action-primary)]">
                        {moment.timeLabel}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                        {moment.title}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
                        {moment.meta}
                      </p>
                    </div>
                  </button>
                ))}

                {communityLife.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3.5"
                  >
                    {item.personName ? (
                      <AuthorCard
                        name={item.personName}
                        avatarUrl={item.personAvatarUrl}
                        meta={item.context}
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => router.push(item.href)}
                      className={`block w-full text-left ${
                        item.personName ? "mt-2.5" : ""
                      }`}
                    >
                      <p className="text-[15px] font-semibold leading-6 text-[var(--color-text-primary)]">
                        {item.narrative}
                      </p>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* QUÉ PUEDES HACER HOY — experience discovery */}
        {isFeatureEnabled("experiences") ? (
          <HomeSection
            title="Qué puedes hacer hoy"
            subtitle="Golf, deporte, planes y encuentros en la comunidad."
            actionLabel="Ver todas"
            onAction={() => router.push("/experiences")}
          >
            {experiences.length === 0 ? (
              <EmptyState
                title="Todavía no hay planes abiertos."
                description="Sé la primera persona en proponer algo para hoy."
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
              <div className="-mx-2.5 flex gap-3.5 overflow-x-auto px-2.5 pb-2 [scrollbar-width:none]">
                {experiences.map((exp) => {
                  const remaining = spotsLeft(exp);
                  return (
                    <div
                      key={exp.id}
                      className="w-[min(62vw,220px)] shrink-0"
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
                        onCta={() => router.push(`/experiences/${exp.id}`)}
                        ctaLabel="Unirme"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </HomeSection>
        ) : null}

        {/* CERCA DE TI — discovery, not directory */}
        {canLocal ? (
          <HomeSection
            title="Cerca de ti"
            subtitle="Sitios y servicios útiles alrededor — descubrimiento, no un directorio."
            actionLabel="Explorar"
            onAction={() => router.push("/near/restaurants")}
          >
            {nearYou.length === 0 ? (
              <EmptyState
                title="Aún no hay sitios cerca publicados."
                description="Cuando la comunidad señale lugares, los verás aquí."
              />
            ) : (
              <LocalLifeRail>
                {nearYou.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    variant="discovery"
                    name={place.name}
                    categoryLabel={place.categoryLabel}
                    areaLabel={place.areaLabel}
                    imageUrl={place.imageUrl}
                    recommendedBy={place.recommendedBy}
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
