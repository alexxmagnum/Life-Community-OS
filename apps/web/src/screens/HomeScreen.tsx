"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityPulse,
  formatExperienceWhen,
  getHomeSponsorSlot,
  listDiscoverableExperiences,
  listNearYou,
} from "@life-community-os/tenant-life-panoramica";
import type { CommunityActivitySource } from "@life-community-os/types";
import {
  CommunityActivityCard,
  CommunityPulseMoment,
  ExperiencePreviewCard,
  HomeSection,
  LocalLifeRail,
  LocalPlaceCard,
  SponsoredFeedCard,
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
  return `${salutation}, ${name}`;
}

function categoryForSource(source: CommunityActivitySource): string {
  switch (source) {
    case "announcement":
      return "Aviso";
    case "experience":
      return "Actividad";
    case "marketplace":
      return "Mercado";
    case "recommendation":
      return "Consejo";
    case "local_entity":
      return "Cerca";
    case "reservation":
      return "Deportes";
    case "group":
      return "Grupo";
    default:
      return "Comunidad";
  }
}

function actionForSource(source: CommunityActivitySource): string | undefined {
  switch (source) {
    case "experience":
      return "Unirme";
    case "marketplace":
      return "Ver";
    case "recommendation":
      return "Ver por qué";
    case "reservation":
      return "Ver plazas";
    case "announcement":
      return "Abrir";
    default:
      return "Abrir";
  }
}

function experienceCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("golf")) return "Golf";
  if (t.includes("pádel") || t.includes("padel")) return "Pádel";
  if (t.includes("yoga") || t.includes("estir")) return "Yoga";
  if (t.includes("paseo") || t.includes("atardecer")) return "Paseo";
  if (t.includes("café") || t.includes("cafe")) return "Encuentro";
  return "Plan";
}

/** Prefer life over administration in editorial order (pre-P3 Today). */
function editorialRank(source: CommunityActivitySource): number {
  switch (source) {
    case "experience":
      return 0;
    case "recommendation":
      return 1;
    case "local_entity":
      return 2;
    case "marketplace":
      return 3;
    case "reservation":
      return 4;
    case "community_content":
      return 5;
    case "group":
      return 6;
    case "announcement":
      return 7;
    default:
      return 5;
  }
}

/**
 * Home front door — P1/P2:
 * Belonging hero first. No search / quick actions / agenda in first viewport.
 * Existing pulse / experiences / near-you remain until P3 Today.
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

  const canPulse =
    isFeatureEnabled("communityPulse") &&
    hasCapability(CAPABILITIES.pulseView);

  const canLocal =
    isFeatureEnabled("localLife") &&
    hasCapability(CAPABILITIES.localView);

  const pulse = useMemo(() => {
    if (!canPulse) return [];
    const raw = buildCommunityPulse({
      limit: 6,
      features: {
        experiences: isFeatureEnabled("experiences"),
        marketplace: isFeatureEnabled("marketplace"),
        recommendations: isFeatureEnabled("recommendations"),
        localLife: isFeatureEnabled("localLife"),
        feed: isFeatureEnabled("feed"),
        resources: isFeatureEnabled("resources"),
        groups: false,
      },
    });
    return [...raw]
      .sort(
        (a, b) =>
          editorialRank(a.source) - editorialRank(b.source) ||
          (b.weight ?? 0) - (a.weight ?? 0),
      )
      .slice(0, 5);
  }, [canPulse, isFeatureEnabled]);

  const sponsor = useMemo(() => getHomeSponsorSlot(), []);

  const experiences = useMemo(() => {
    if (!isFeatureEnabled("experiences")) return [];
    return listDiscoverableExperiences().slice(0, 6);
  }, [isFeatureEnabled]);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listNearYou().slice(0, 6);
  }, [canLocal]);

  return (
    <div className="space-y-6 overflow-x-hidden pb-8 md:space-y-8">
      <TerritoryHero
        variant="belonging"
        imageUrl={theme.imagery.homeHero}
        imageAlt={territoryName}
        greeting={greeting}
        areaLabel={areaLine}
        weatherLabel={weatherLabel}
      />

      <div className="space-y-8 pt-1 md:space-y-10">
        {canPulse ? (
          <CommunityPulseMoment
            title={todayTitle}
            actionLabel="Ver todo"
            onAction={() => router.push("/community")}
            layout="stack"
            emptyLabel="Hoy está tranquilo por aquí."
            emptyActionLabel="Descubrir cerca"
            onEmptyAction={() => router.push("/discover")}
          >
            {pulse.length > 0
              ? pulse.flatMap((item, index) => {
                  const card = (
                    <CommunityActivityCard
                      key={item.id}
                      variant="compact"
                      categoryLabel={categoryForSource(item.source)}
                      headline={item.headline}
                      context={item.context}
                      imageUrl={item.imageUrl}
                      personName={item.personName}
                      personAvatarUrl={item.personAvatarUrl}
                      live={item.live}
                      actionLabel={actionForSource(item.source)}
                      onClick={
                        item.href
                          ? () => router.push(item.href!)
                          : undefined
                      }
                      onAction={
                        item.href
                          ? () => router.push(item.href!)
                          : undefined
                      }
                    />
                  );
                  if (index === 1 && sponsor?.enabled) {
                    return [
                      <SponsoredFeedCard
                        key="home-sponsor"
                        badgeLabel={sponsor.badgeLabel}
                        title={sponsor.title}
                        authorName={sponsor.authorName}
                        imageUrl={sponsor.imageUrl}
                        onClick={
                          sponsor.href
                            ? () => router.push(sponsor.href!)
                            : undefined
                        }
                      />,
                      card,
                    ];
                  }
                  return [card];
                })
              : null}
          </CommunityPulseMoment>
        ) : null}

        {experiences.length > 0 ? (
          <HomeSection
            title="Qué puedes hacer hoy"
            actionLabel="Ver todo"
            onAction={() => router.push("/discover")}
          >
            <div className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="w-[min(62vw,220px)] shrink-0"
                >
                  <ExperiencePreviewCard
                    title={exp.title}
                    when={formatExperienceWhen(exp.startsAt)}
                    where={exp.location}
                    imageUrl={exp.imageUrl}
                    categoryLabel={experienceCategory(exp.title)}
                    peopleLabel={
                      exp.participantCount > 0
                        ? `${exp.participantCount} van`
                        : undefined
                    }
                    onClick={() => router.push(`/experiences/${exp.id}`)}
                    onCta={() => router.push(`/experiences/${exp.id}`)}
                    ctaLabel="Unirme"
                  />
                </div>
              ))}
            </div>
          </HomeSection>
        ) : null}

        {nearYou.length > 0 ? (
          <HomeSection
            title="Cerca de ti"
            actionLabel="Ver todo"
            onAction={() => router.push("/discover")}
          >
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
                  onClick={() => router.push("/discover")}
                />
              ))}
            </LocalLifeRail>
          </HomeSection>
        ) : null}
      </div>
    </div>
  );
}
