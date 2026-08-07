"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityPulse,
  communityPulseLivingLine,
  currentMember,
  formatContentWhen,
  listNearYou,
  listNeighbourRecommendations,
  listOfficialContent,
  listPublishedCommunityContent,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommunityActivityCard,
  CommunityPulseMoment,
  CommunityStory,
  ContentBlock,
  HomeSection,
  LocalLifeRail,
  LocalPlaceCard,
  NeighbourTipCard,
  OfficialNoticeCard,
  QuickActionBar,
  TerritoryHero,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

function greetingFor(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Buenos días, ${name}`;
  if (hour < 18) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const { feedItems } = useCommunityInteractions();

  const greeting = greetingFor(currentMember.displayName);
  const territoryName =
    theme.identity?.territoryName ?? theme.logoText;
  const areaLabel =
    currentMember.areaLabel ||
    theme.identity?.defaultAreaName ||
    theme.logoText;
  const homeCallout =
    theme.identity?.homeCallout ?? "Tu comunidad hoy";
  const pulseTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    territoryName,
  );

  const canPulse =
    isFeatureEnabled("communityPulse") &&
    hasCapability(CAPABILITIES.pulseView);

  const canLocal =
    isFeatureEnabled("localLife") &&
    hasCapability(CAPABILITIES.localView);

  const pulse = useMemo(() => {
    if (!canPulse) return [];
    return buildCommunityPulse({
      limit: 4,
      features: {
        experiences: isFeatureEnabled("experiences"),
        marketplace: isFeatureEnabled("marketplace"),
        recommendations: isFeatureEnabled("recommendations"),
        localLife: isFeatureEnabled("localLife"),
        feed: isFeatureEnabled("feed"),
        resources: isFeatureEnabled("resources"),
        groups: isFeatureEnabled("groups"),
      },
    });
  }, [canPulse, isFeatureEnabled]);

  const livingLine = communityPulseLivingLine(pulse);

  const nearYou = useMemo(() => {
    if (!canLocal) return [];
    return listNearYou().slice(0, 4);
  }, [canLocal]);

  const neighbourTip = useMemo(() => {
    if (!canLocal || !isFeatureEnabled("recommendations")) return null;
    return listNeighbourRecommendations()[0] ?? null;
  }, [canLocal, isFeatureEnabled]);

  const official = useMemo(() => {
    const all = listOfficialContent();
    return all.find((c) => c.imageUrl) ?? all[0];
  }, []);

  const neighbourStory = useMemo(() => {
    return (feedItems.length ? feedItems : listPublishedCommunityContent()).find(
      (c) => !c.isOfficial && c.status === "published",
    );
  }, [feedItems]);

  const recentLife = official ?? neighbourStory;

  const contributeItems = useMemo(() => {
    const items: {
      id: string;
      label: string;
      icon: string;
      onClick: () => void;
    }[] = [];

    if (isFeatureEnabled("experiences")) {
      items.push({
        id: "join",
        label: "Participar",
        icon: "＋",
        onClick: () => router.push("/discover"),
      });
    }
    if (isFeatureEnabled("recommendations") || canLocal) {
      items.push({
        id: "recommend",
        label: "Recomendar",
        icon: "★",
        onClick: () => router.push("/discover"),
      });
    }
    if (isFeatureEnabled("marketplace")) {
      items.push({
        id: "share",
        label: "Compartir",
        icon: "↔",
        onClick: () => router.push("/marketplace"),
      });
    }

    return items.slice(0, 3);
  }, [canLocal, isFeatureEnabled, router]);

  return (
    <div className="-mx-4 -mt-3 md:-mx-8 md:-mt-8">
      <TerritoryHero
        territoryName={territoryName}
        greeting={greeting}
        callout={homeCallout}
        areaLabel={areaLabel}
        weatherLabel="Soleado · 24°"
        imageUrl={theme.imagery.homeHero}
        notificationCount={3}
        onNotifications={() => router.push("/me")}
      />

      <ContentBlock className="space-y-11 pt-7 pb-4">
        {contributeItems.length > 0 ? (
          <section className="space-y-3">
            <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
              Tú también formas parte.
            </p>
            <QuickActionBar items={contributeItems} />
          </section>
        ) : null}

        {canPulse ? (
          <CommunityPulseMoment
            title={pulseTitle}
            livingLine={livingLine}
            layout="stack"
            emptyLabel="Hoy está tranquilo por aquí."
            emptyActionLabel="Descubrir cerca"
            onEmptyAction={() => router.push("/discover")}
          >
            {pulse.length > 0
              ? pulse.map((item) => (
                  <CommunityActivityCard
                    key={item.id}
                    headline={item.headline}
                    context={item.context}
                    imageUrl={item.imageUrl}
                    personName={item.personName}
                    personAvatarUrl={item.personAvatarUrl}
                    live={item.live}
                    onClick={
                      item.href
                        ? () => router.push(item.href!)
                        : undefined
                    }
                  />
                ))
              : null}
          </CommunityPulseMoment>
        ) : null}

        {canLocal && (nearYou.length > 0 || neighbourTip) ? (
          <HomeSection
            title="Vida cerca"
            subtitle="Lo que tus vecinos usan y recomiendan."
            actionLabel="Ver más"
            onAction={() => router.push("/discover")}
          >
            {nearYou.length > 0 ? (
              <LocalLifeRail>
                {nearYou.map((place) => (
                  <LocalPlaceCard
                    key={place.id}
                    name={place.name}
                    categoryLabel={place.categoryLabel}
                    areaLabel={place.areaLabel}
                    blurb={place.story}
                    imageUrl={place.imageUrl}
                    recommendedBy={place.recommendedBy}
                    verified={place.verified}
                    trustNote={place.trustNote}
                    onClick={() => router.push("/discover")}
                  />
                ))}
              </LocalLifeRail>
            ) : null}
            {neighbourTip ? (
              <NeighbourTipCard
                quote={neighbourTip.body}
                author={neighbourTip.authorName}
                relatedLabel={neighbourTip.relatedLabel}
                imageUrl={neighbourTip.imageUrl}
                onClick={() => router.push("/discover")}
                className={nearYou.length > 0 ? "mt-4" : undefined}
              />
            ) : null}
          </HomeSection>
        ) : null}

        {isFeatureEnabled("feed") && recentLife ? (
          <HomeSection title="Vale la pena saber">
            {official && recentLife.id === official.id ? (
              <OfficialNoticeCard
                title={official.title}
                preview={official.body}
                imageUrl={official.imageUrl}
                onClick={() =>
                  router.push(`/community/content/${official.id}`)
                }
              />
            ) : neighbourStory ? (
              <CommunityStory
                eyebrow="Vecinos"
                title={neighbourStory.title}
                body={neighbourStory.body}
                meta={formatContentWhen(
                  neighbourStory.publishedAt ?? neighbourStory.createdAt,
                )}
                imageUrl={neighbourStory.imageUrl}
                authorName={neighbourStory.author.name}
                authorAvatarUrl={neighbourStory.author.avatarUrl}
                onClick={() =>
                  router.push(`/community/content/${neighbourStory.id}`)
                }
              />
            ) : null}
          </HomeSection>
        ) : null}
      </ContentBlock>
    </div>
  );
}
