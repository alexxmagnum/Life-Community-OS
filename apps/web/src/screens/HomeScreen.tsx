"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityLifeItems,
  buildForYouItems,
  buildTodayMoments,
  experienceActivityLabel,
  formatExperienceWhen,
  listCuratedNearYou,
  listUpcomingHomeExperiences,
  spotsLeft,
} from "@life-community-os/tenant-life-panoramica";
import {
  AuthorCard,
  CommunityActivityCard,
  EmptyState,
  ExperiencePreviewCard,
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
function belongingGreeting(name: string, now = new Date()): string {
  const hour = now.getHours();
  const salutation =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  return `${salutation} ${name}`;
}

/**
 * Home = digital plaza of Panorámica.
 * "What is happening today in my community?"
 * Not a dashboard, marketplace, calendar, or admin panel.
 */
export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability, demoMember } = useTenant();

  const territoryName =
    theme.identity?.territoryName ?? theme.logoText;
  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    territoryName,
  );
  const areaLine =
    demoMember.areaLabel ||
    theme.identity?.defaultAreaName ||
    undefined;
  const weatherLabel = theme.identity?.weatherLabel;
  const greeting = belongingGreeting(demoMember.displayName);

  const canLocal =
    isFeatureEnabled("localLife") &&
    hasCapability(CAPABILITIES.localView);

  const forYou = useMemo(
    () => buildForYouItems(demoMember, { limit: 4 }),
    [demoMember],
  );

  const today = useMemo(() => buildTodayMoments({ limit: 5 }), []);

  const experiences = useMemo(() => {
    if (!isFeatureEnabled("experiences")) return [];
    if (!hasCapability(CAPABILITIES.experienceView)) return [];
    return listUpcomingHomeExperiences({ limit: 6 });
  }, [isFeatureEnabled, hasCapability]);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listCuratedNearYou(demoMember, { limit: 4 });
  }, [canLocal, demoMember]);

  const communityLife = useMemo(
    () => buildCommunityLifeItems({ limit: 5 }),
    [],
  );

  return (
    <div className="space-y-6 overflow-x-hidden pb-8 md:space-y-8">
      {/* 2. Belonging hero */}
      <TerritoryHero
        variant="belonging"
        imageUrl={theme.imagery.homeHero}
        imageAlt={territoryName}
        greeting={greeting}
        areaLabel={areaLine}
        weatherLabel={weatherLabel}
      />

      <div className="space-y-8 pt-1 md:space-y-10">
        {/* 3. Para ti */}
        <HomeSection
          title="Para ti"
          subtitle="Lo que encaja con tu zona e intereses."
        >
          {forYou.length === 0 ? (
            <EmptyState
              title="Tu comunidad empieza aquí."
              description="Cuando haya planes y sitios para ti, los verás en este apartado."
            />
          ) : (
            <div className="space-y-3">
              {forYou.map((item) => (
                <CommunityActivityCard
                  key={item.id}
                  variant="compact"
                  categoryLabel={
                    item.kind === "experience"
                      ? "Para ti"
                      : item.kind === "welcome"
                        ? "Bienvenida"
                        : item.kind === "proposal"
                          ? "Propuesta"
                          : "Cerca"
                  }
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
        </HomeSection>

        {/* 4. Hoy en Panorámica */}
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

        {/* 5. Próximas experiencias */}
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
              <div className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
                {experiences.map((exp) => {
                  const remaining = spotsLeft(exp);
                  return (
                    <div
                      key={exp.id}
                      className="w-[min(62vw,220px)] shrink-0"
                    >
                      <ExperiencePreviewCard
                        title={exp.title}
                        when={formatExperienceWhen(exp.startsAt)}
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

        {/* 6. Cerca de ti */}
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
                      if (place.kind === "restaurant" || place.kind === "cafe") {
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

        {/* 7. Vida de comunidad */}
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
                  {/* Author/Avatar stay outside the open control — Avatar is a button. */}
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
