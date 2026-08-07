"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  currentMember,
  formatContentWhen,
  formatExperienceTime,
  listDiscoverableExperiences,
  listOfficialContent,
  listPublishedCommunityContent,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommunityPulseCard,
  CommunityPulseMoment,
  CommunityStory,
  ContentBlock,
  ExploreLink,
  OfficialNoticeCard,
  ParticipationInvitationCard,
  TerritoryHero,
} from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { useReservations } from "@/providers/ReservationProvider";

function greetingFor(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Buenos días, ${name}`;
  if (hour < 18) return `Buenas tardes, ${name}`;
  return `Buenas noches, ${name}`;
}

function isLiveSoon(startsAt: string) {
  const diff = new Date(startsAt).getTime() - Date.now();
  return diff > 0 && diff < 2 * 60 * 60 * 1000;
}

export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled } = useTenant();
  const { joinedExperiences } = useExperienceParticipation();
  const { feedItems } = useCommunityInteractions();
  const { upcoming: upcomingReservations } = useReservations();

  const greeting = greetingFor(currentMember.displayName);
  const communityName = theme.logoText;

  const official = useMemo(() => {
    const all = listOfficialContent();
    return all.find((c) => c.imageUrl) ?? all[0];
  }, []);

  const neighbourStory = useMemo(() => {
    return (feedItems.length ? feedItems : listPublishedCommunityContent()).find(
      (c) => !c.isOfficial && c.status === "published",
    );
  }, [feedItems]);

  const pulseItems = useMemo(() => {
    type Pulse = {
      id: string;
      time: string;
      title: string;
      meta: string;
      live?: boolean;
      href: string;
    };
    const items: Pulse[] = [];

    for (const exp of joinedExperiences.slice(0, 1)) {
      items.push({
        id: `joined-${exp.id}`,
        time: formatExperienceTime(exp.startsAt),
        title: exp.title,
        meta: exp.location,
        live: isLiveSoon(exp.startsAt),
        href: `/experiences/${exp.id}`,
      });
    }
    for (const r of upcomingReservations.slice(0, 1)) {
      items.push({
        id: `res-${r.id}`,
        time: r.start,
        title: r.resourceName,
        meta: r.location,
        href: `/resources/${r.resourceId}`,
      });
    }
    for (const exp of listDiscoverableExperiences().slice(0, 3)) {
      if (items.some((i) => i.href === `/experiences/${exp.id}`)) continue;
      items.push({
        id: `exp-${exp.id}`,
        time: formatExperienceTime(exp.startsAt),
        title: exp.title,
        meta: exp.location,
        live: isLiveSoon(exp.startsAt),
        href: `/experiences/${exp.id}`,
      });
    }
    return items.slice(0, 3);
  }, [joinedExperiences, upcomingReservations]);

  const participatingCount = listDiscoverableExperiences().reduce(
    (sum, e) => sum + e.participantCount,
    0,
  );

  const livingLine =
    pulseItems.length === 0
      ? "Hoy está tranquilo en la comunidad"
      : participatingCount > 0
        ? `${participatingCount} vecinos participan ahora`
        : "Hay vida cerca de ti";

  const invitation = useMemo(() => {
    if (isFeatureEnabled("experiences")) {
      return {
        title: "Participa hoy",
        description: "Únete a un plan con vecinos cerca de ti.",
        ctaLabel: "Ver planes",
        href: "/discover?intent=hacer",
      };
    }
    if (isFeatureEnabled("marketplace")) {
      return {
        title: "Mira el mercado",
        description: "Lo que tus vecinos ofrecen o necesitan.",
        ctaLabel: "Abrir mercado",
        href: "/marketplace",
      };
    }
    return {
      title: "Explora la comunidad",
      description: "Descubre qué está pasando cerca.",
      ctaLabel: "Descubrir",
      href: "/discover",
    };
  }, [isFeatureEnabled]);

  const recentLife = official ?? neighbourStory;

  return (
    <div className="-mx-4 -mt-3 md:-mx-8 md:-mt-8">
      <TerritoryHero
        territoryName={communityName}
        greeting={greeting}
        callout="¿Qué está pasando ahora?"
        areaLabel={communityName}
        weatherLabel="Soleado · 24°"
        imageUrl={theme.imagery.homeHero}
        notificationCount={3}
        onNotifications={() => router.push("/me")}
      />

      <ContentBlock className="space-y-10 pt-8">
        <CommunityPulseMoment
          title="Ahora en la comunidad"
          livingLine={livingLine}
          emptyLabel="Nada programado — descubre algo cerca."
          emptyActionLabel="Descubrir"
          onEmptyAction={() => router.push("/discover")}
        >
          {pulseItems.length > 0
            ? pulseItems.map((item) => (
                <CommunityPulseCard
                  key={item.id}
                  time={item.time}
                  title={item.title}
                  meta={item.meta}
                  live={item.live}
                  onClick={() => router.push(item.href)}
                />
              ))
            : null}
        </CommunityPulseMoment>

        <ParticipationInvitationCard
          title={invitation.title}
          description={invitation.description}
          ctaLabel={invitation.ctaLabel}
          onClick={() => router.push(invitation.href)}
        />

        {isFeatureEnabled("feed") && recentLife ? (
          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8 text-[var(--color-text-primary)]">
              Vida reciente
            </h2>
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
          </section>
        ) : null}

        <section className="space-y-3 border-t border-[var(--color-border-subtle)] pt-8">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-[var(--color-text-primary)]">
            Seguir explorando
          </h2>
          <p className="text-[16px] leading-6 text-[var(--color-text-secondary)]">
            Tu comunidad sigue aquí cuando quieras.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <ExploreLink
              label="Comunidad"
              hint="Quién está aquí y qué se habla"
              onClick={() => router.push("/community")}
            />
            <ExploreLink
              label="Descubrir"
              hint="Hacer · Ir · Encontrar"
              onClick={() => router.push("/discover")}
            />
            {isFeatureEnabled("marketplace") ? (
              <ExploreLink
                label="Mercado"
                hint="Ofrecer, buscar o compartir"
                onClick={() => router.push("/marketplace")}
              />
            ) : null}
          </div>
        </section>
      </ContentBlock>
    </div>
  );
}
