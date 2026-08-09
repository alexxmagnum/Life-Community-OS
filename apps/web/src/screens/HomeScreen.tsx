"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  buildForYouItems,
  buildTodayMoments,
  experienceActivityLabel,
  formatExperienceWhen,
  getTerritoryAccessContext,
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
import { TerritoryBelongingCard } from "@/components/TerritoryBelongingCard";
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
  if (kind === "proposal") return "Propuesta";
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
 * Home = digital plaza of Panorámica.
 * "What is happening today in my community?"
 * Not a dashboard, marketplace, calendar, or admin panel.
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

  /**
   * First paint always uses HYDRATE_SAFE (no localStorage, stable ranks).
   * After mount, upgrade to live ranking + session creates + timed greeting.
   */
  const [live, setLive] = useState(false);
  const [greeting, setGreeting] = useState(
    () => `Hola ${demoMember.displayName}`,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [forYouOpen, setForYouOpen] = useState(false);

  useEffect(() => {
    setLive(true);
    setGreeting(belongingGreeting(demoMember.displayName, madridHour()));
  }, [demoMember.displayName]);

  const searchHits = useMemo(
    () => searchHomeCatalog(searchQuery, 8),
    [searchQuery],
  );

  const territoryAccess = useMemo(
    () => getTerritoryAccessContext(demoPersonId),
    [demoPersonId],
  );

  const territoryName = theme.identity?.territoryName ?? theme.logoText;
  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    territoryName,
  );
  const areaLine =
    territoryAccess.verifiedAreaLabels[0] ||
    demoMember.areaLabel ||
    theme.identity?.defaultAreaName ||
    undefined;
  const weatherLabel = theme.identity?.weatherLabel;

  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  const frontDoorOpts = live ? LIVE_OPTS : HYDRATE_SAFE;

  const forYou = useMemo(
    () => buildForYouItems(demoMember, { limit: 4, ...frontDoorOpts }),
    [demoMember, frontDoorOpts],
  );
  const forYouPeek = forYou[forYou.length - 1];

  const today = useMemo(
    () => buildTodayMoments({ limit: 5, ...frontDoorOpts }),
    [frontDoorOpts],
  );

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

  // Catalog-only + fixed ids — identical on server and client (no frontDoorOpts).
  const communityLife = useMemo(
    () => buildCommunityLifeItems({ limit: 5 }),
    [],
  );

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
        <TerritoryBelongingCard access={territoryAccess} compact />

        {forYou.length === 0 ? (
          <HomeSection
            title="Para ti"
            subtitle="Lo que encaja con tu zona e intereses."
          >
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando haya planes y sitios para ti, los verás en este apartado."
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
                  Lo que encaja con tu zona e intereses.
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

            {/* Collapsed peek — title + one context line only; full cards on expand */}
            {!forYouOpen ? (
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
            ) : (
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
            )}
          </section>
        )}

        <HomeSection
          title={todayTitle}
          subtitle="Qué está pasando hoy en tu comunidad."
          actionLabel="Ver comunidad"
          onAction={() => router.push("/community")}
        >
          {today.length === 0 ? (
            <EmptyState
              title="Hoy está tranquilo por aquí."
              description="Cuando haya planes u avisos de hoy, aparecerán aquí."
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
            <div className="space-y-3">
              {today.map((moment) => (
                <button
                  key={moment.id}
                  type="button"
                  onClick={() => router.push(moment.href)}
                  className="flex w-full gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)]"
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
            </div>
          )}
        </HomeSection>

        {isFeatureEnabled("experiences") ? (
          <HomeSection
            title="Próximas experiencias"
            subtitle="Momentos creados por vecinos."
            actionLabel="Ver todas"
            onAction={() => router.push("/experiences")}
          >
            {experiences.length === 0 ? (
              <EmptyState
                title="No hay experiencias todavía. Sé la primera persona en crear una."
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

        {canLocal ? (
          <HomeSection
            title="Cerca de ti"
            subtitle="Sitios útiles alrededor de tu territorio."
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

        <HomeSection
          title="Vida de comunidad"
          subtitle="Vecinos que crean vida — no es una red social."
          actionLabel="Ver más"
          onAction={() => router.push("/community")}
        >
          {communityLife.length === 0 ? (
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando alguien cree una experiencia o una propuesta, lo verás aquí."
            />
          ) : (
            <div className="space-y-3">
              {communityLife.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]"
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
        </HomeSection>
      </div>
    </div>
  );
}
