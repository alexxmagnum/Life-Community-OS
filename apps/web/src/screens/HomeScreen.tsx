"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  currentMember,
  formatContentWhen,
  formatExperienceTime,
  formatExperienceWhen,
  listDiscoverableExperiences,
  listGroups,
  listLocalPlaces,
  listMarketplaceListings,
  listOfficialContent,
  listPublishedCommunityContent,
  marketplaceKindLabel,
  recommendations,
} from "@life-community-os/tenant-life-panoramica";
import {
  ActivityCard,
  CommunityPulseCard,
  CommunityPulseMoment,
  CommunityStory,
  GroupCard,
  HomeSection,
  MarketplaceItemCard,
  OfficialNoticeCard,
  QuickActionBar,
  TerritoryHero,
  LocalPlaceCard,
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
  const shortName = theme.shortName || theme.logoText;

  const official = useMemo(() => {
    const all = listOfficialContent();
    return all.find((c) => c.imageUrl) ?? all[0];
  }, []);

  const neighbourPosts = useMemo(() => {
    return (feedItems.length ? feedItems : listPublishedCommunityContent())
      .filter((c) => !c.isOfficial && c.status === "published")
      .slice(0, 2);
  }, [feedItems]);

  const plans = listDiscoverableExperiences().slice(0, 2);
  const localDiscoveries = listLocalPlaces().slice(0, 3);
  const marketHighlights = listMarketplaceListings().slice(0, 2);
  const groups = listGroups().slice(0, 2);
  const tip = recommendations[0];

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

    for (const exp of joinedExperiences.slice(0, 2)) {
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
    for (const exp of listDiscoverableExperiences().slice(0, 4)) {
      if (items.some((i) => i.href === `/experiences/${exp.id}`)) continue;
      items.push({
        id: `exp-${exp.id}`,
        time: formatExperienceTime(exp.startsAt),
        title: exp.title,
        meta: exp.areaLabel,
        live: isLiveSoon(exp.startsAt),
        href: `/experiences/${exp.id}`,
      });
    }
    return items.slice(0, 5);
  }, [joinedExperiences, upcomingReservations]);

  const participatingCount = listDiscoverableExperiences().reduce(
    (sum, e) => sum + e.participantCount,
    0,
  );

  const livingLine = useMemo(() => {
    const parts: string[] = [];
    if (participatingCount > 0) {
      parts.push(`${participatingCount} vecinos participan`);
    }
    if (neighbourPosts.length > 0) {
      parts.push("Hay actividad de vecinos");
    }
    if (marketHighlights.length > 0 && isFeatureEnabled("marketplace")) {
      parts.push("Nuevos anuncios en el mercado");
    }
    if (parts.length === 0) {
      return "Hoy el territorio está tranquilo — descubre algo cerca";
    }
    return parts.join(" · ");
  }, [isFeatureEnabled, marketHighlights.length, neighbourPosts.length, participatingCount]);

  const heroCallout =
    pulseItems.length > 0
      ? "Todo lo que ocurre alrededor de tu comunidad, en un solo lugar"
      : `Empieza el día en ${shortName}`;

  const quickActions = useMemo(() => {
    const items: {
      id: string;
      label: string;
      icon: string;
      onClick: () => void;
    }[] = [
      {
        id: "community",
        label: "Comunidad",
        icon: "◌",
        onClick: () => router.push("/community"),
      },
    ];
    if (isFeatureEnabled("experiences")) {
      items.push({
        id: "plans",
        label: "Planes",
        icon: "◎",
        onClick: () => router.push("/discover?segment=actividades"),
      });
    }
    if (isFeatureEnabled("marketplace")) {
      items.push({
        id: "market",
        label: "Mercado",
        icon: "⇄",
        onClick: () => router.push("/marketplace"),
      });
    } else if (isFeatureEnabled("resources")) {
      items.push({
        id: "reserve",
        label: "Reservar",
        icon: "▣",
        onClick: () => router.push("/resources"),
      });
    }
    return items.slice(0, 3);
  }, [isFeatureEnabled, router]);

  return (
    <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-8">
      <TerritoryHero
        territoryName={theme.logoText}
        greeting={greeting}
        callout={heroCallout}
        areaLabel={currentMember.areaLabel}
        weatherLabel="Soleado · 24°"
        imageUrl={theme.imagery.homeHero}
        notificationCount={3}
        onNotifications={() => router.push("/me")}
      />

      <div className="space-y-11 px-4 pb-6 pt-7 md:px-8 md:pt-10">
        <QuickActionBar items={quickActions} />

        <CommunityPulseMoment
          title={`Hoy en ${shortName}`}
          livingLine={livingLine}
          emptyLabel="Nada programado todavía — descubre vida cerca."
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

        {isFeatureEnabled("feed") && (official || neighbourPosts[0]) ? (
          <HomeSection
            title="Actividad de vecinos"
            subtitle="Conversaciones, avisos y lo que importa hoy."
            actionLabel="Ver"
            onAction={() => router.push("/community")}
          >
            <div className="space-y-8">
              {official ? (
                <OfficialNoticeCard
                  title={official.title}
                  preview={official.body}
                  areaLabel={official.areaLabel}
                  imageUrl={official.imageUrl}
                  onClick={() =>
                    router.push(`/community/content/${official.id}`)
                  }
                />
              ) : null}
              {neighbourPosts.map((post) => (
                <CommunityStory
                  key={post.id}
                  eyebrow="Vecinos"
                  title={post.title}
                  body={post.body}
                  meta={formatContentWhen(post.publishedAt ?? post.createdAt)}
                  imageUrl={post.imageUrl}
                  authorName={post.author.name}
                  authorAvatarUrl={post.author.avatarUrl}
                  onClick={() =>
                    router.push(`/community/content/${post.id}`)
                  }
                />
              ))}
            </div>
          </HomeSection>
        ) : null}

        {isFeatureEnabled("experiences") && plans.length > 0 ? (
          <HomeSection
            title="Planes a los que unirte"
            subtitle="Ocio, deporte y encuentros cerca de ti."
            actionLabel="Ver más"
            onAction={() => router.push("/discover?segment=actividades")}
          >
            <div className="space-y-5">
              {plans.map((exp) => (
                <ActivityCard
                  key={exp.id}
                  title={exp.title}
                  when={formatExperienceWhen(exp.startsAt)}
                  where={exp.location}
                  imageUrl={exp.imageUrl}
                  peopleLabel={`${exp.participantCount} personas van`}
                  ctaLabel="Participar"
                  onClick={() => router.push(`/experiences/${exp.id}`)}
                  onCta={() => router.push(`/experiences/${exp.id}`)}
                />
              ))}
            </div>
          </HomeSection>
        ) : null}

        {isFeatureEnabled("groups") ? (
          <HomeSection
            title="Grupos"
            subtitle="Con quién puedes compartir el día a día."
            actionLabel="Ver"
            onAction={() => router.push("/community?tab=groups")}
          >
            <div className="grid grid-cols-2 gap-3">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  name={g.name}
                  members={g.memberCount}
                  imageUrl={g.imageUrl}
                  onOpen={() => router.push("/community?tab=groups")}
                />
              ))}
            </div>
          </HomeSection>
        ) : null}

        <HomeSection
          title="Descubrimientos locales"
          subtitle="Sitios, servicios y confianza de vecinos."
          actionLabel="Explorar"
          onAction={() => router.push("/discover")}
        >
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {localDiscoveries.map((place) => (
              <LocalPlaceCard
                key={place.id}
                name={place.name}
                categoryLabel={place.categoryLabel}
                areaLabel={place.areaLabel}
                blurb={place.blurb}
                imageUrl={place.imageUrl}
                recommendedBy={place.recommendedBy}
                verified={place.verified}
                onClick={() => router.push("/discover?segment=lugares")}
              />
            ))}
          </div>
          {isFeatureEnabled("recommendations") && tip ? (
            <CommunityStory
              className="mt-6"
              eyebrow="Recomendación"
              title={`De confianza · ${tip.author}`}
              body={tip.quote}
              imageUrl={tip.imageUrl}
              authorName={tip.author}
              onClick={() => router.push("/discover?segment=recomendaciones")}
            />
          ) : null}
        </HomeSection>

        {isFeatureEnabled("marketplace") ? (
          <HomeSection
            title="Mercado entre vecinos"
            subtitle="Compra, vende, regala o pide — sin salir de la comunidad."
            actionLabel="Ver mercado"
            onAction={() => router.push("/marketplace")}
          >
            <div className="space-y-3">
              {marketHighlights.map((item) => (
                <MarketplaceItemCard
                  key={item.id}
                  kindLabel={marketplaceKindLabel(item.kind)}
                  title={item.title}
                  meta={item.areaLabel}
                  priceLabel={item.priceLabel}
                  imageUrl={item.imageUrl}
                  authorName={item.authorName}
                  onClick={() => router.push("/marketplace")}
                />
              ))}
            </div>
          </HomeSection>
        ) : null}

        {isFeatureEnabled("calendar") ? (
          <button
            type="button"
            onClick={() => router.push("/calendar")}
            className="flex w-full items-center justify-between rounded-[var(--radius-xl)] bg-[var(--color-action-primary-subtle)] px-5 py-4 text-left"
          >
            <span>
              <span className="block text-[17px] font-semibold text-[var(--color-action-primary)]">
                Mi agenda
              </span>
              <span className="mt-1 block text-[14px] text-[var(--color-text-secondary)]">
                Tus planes y reservas de esta semana
              </span>
            </span>
            <span className="text-[var(--color-action-primary)]">→</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
