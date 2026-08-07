"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  currentMember,
  formatContentWhen,
  formatExperienceTime,
  formatExperienceWhen,
  listDiscoverableExperiences,
  listOfficialContent,
  listPublishedCommunityContent,
  listResources,
  recommendations,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommunityPulseCard,
  ExperiencePreviewCard,
  OfficialNoticeCard,
  ParticipationInvitationCard,
  PlacePreviewCard,
  QuickActionBar,
  RecommendationCard,
  SectionHeader,
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

function weekdayLabel() {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled } = useTenant();
  const { joinedExperiences } = useExperienceParticipation();
  const { feedItems } = useCommunityInteractions();
  const { upcoming: upcomingReservations } = useReservations();

  const greeting = greetingFor(currentMember.displayName);
  const contextLabel = `${currentMember.areaLabel} · ${weekdayLabel()}`;
  const weatherLabel = "Soleado · 24°";

  const official = useMemo(() => {
    const all = listOfficialContent();
    return all.find((c) => c.imageUrl) ?? all[0];
  }, []);

  const neighbourPulse = useMemo(() => {
    return (feedItems.length ? feedItems : listPublishedCommunityContent())
      .filter((c) => !c.isOfficial && c.status === "published")
      .slice(0, 2);
  }, [feedItems]);

  const featuredExperiences = listDiscoverableExperiences().slice(0, 2);
  const featuredPlaces = listResources().slice(0, 3);

  const pulseItems = useMemo(() => {
    const items: {
      id: string;
      eyebrow: string;
      title: string;
      meta: string;
      imageUrl?: string;
      tone: "experience" | "official" | "neighbour" | "place" | "activity";
      href: string;
    }[] = [];

    for (const exp of joinedExperiences.slice(0, 2)) {
      items.push({
        id: `joined-${exp.id}`,
        eyebrow: "Tu plan",
        title: exp.title,
        meta: `${formatExperienceTime(exp.startsAt)} · ${exp.location}`,
        imageUrl: exp.imageUrl,
        tone: "activity",
        href: `/experiences/${exp.id}`,
      });
    }

    for (const r of upcomingReservations.slice(0, 1)) {
      items.push({
        id: `res-${r.id}`,
        eyebrow: "Tu reserva",
        title: r.resourceName,
        meta: `${r.start} · ${r.location}`,
        imageUrl: r.resourceImageUrl,
        tone: "place",
        href: `/resources/${r.resourceId}`,
      });
    }

    if (official) {
      items.push({
        id: `off-${official.id}`,
        eyebrow: "Aviso oficial",
        title: official.title,
        meta: `${formatContentWhen(official.publishedAt ?? official.createdAt)}${
          official.areaLabel ? ` · ${official.areaLabel}` : ""
        }`,
        imageUrl: official.imageUrl,
        tone: "official",
        href: `/community/content/${official.id}`,
      });
    }

    for (const exp of featuredExperiences) {
      if (items.some((i) => i.href === `/experiences/${exp.id}`)) continue;
      items.push({
        id: `exp-${exp.id}`,
        eyebrow: "Pronto",
        title: exp.title,
        meta: `${formatExperienceWhen(exp.startsAt)} · ${exp.areaLabel}`,
        imageUrl: exp.imageUrl,
        tone: "experience",
        href: `/experiences/${exp.id}`,
      });
    }

    for (const post of neighbourPulse) {
      items.push({
        id: `nb-${post.id}`,
        eyebrow: "Vecinos",
        title: post.title,
        meta: `${post.author.name} · ${formatContentWhen(post.publishedAt ?? post.createdAt)}`,
        imageUrl: post.imageUrl,
        tone: "neighbour",
        href: `/community/content/${post.id}`,
      });
    }

    return items.slice(0, 6);
  }, [
    featuredExperiences,
    joinedExperiences,
    neighbourPulse,
    official,
    upcomingReservations,
  ]);

  const invitations = useMemo(() => {
    const list: {
      id: string;
      title: string;
      description: string;
      ctaLabel: string;
      href: string;
    }[] = [];

    if (isFeatureEnabled("experiences")) {
      list.push({
        id: "join-activity",
        title: "Únete a una actividad",
        description: "Paseos, clases y encuentros cerca de ti.",
        ctaLabel: "Ver actividades",
        href: "/discover?segment=experiences",
      });
    }
    if (isFeatureEnabled("resources")) {
      list.push({
        id: "reserve-place",
        title: "Reserva un espacio",
        description: "Pistas, salas y zonas compartidas.",
        ctaLabel: "Ver lugares",
        href: "/resources",
      });
    }
    if (isFeatureEnabled("services") || isFeatureEnabled("recommendations")) {
      list.push({
        id: "discover-near",
        title: "Descubre lugares cerca de ti",
        description: "Servicios y recomendaciones del barrio.",
        ctaLabel: "Explorar",
        href: "/discover?segment=services",
      });
    }
    if (isFeatureEnabled("feed")) {
      list.push({
        id: "share-idea",
        title: "Comparte una idea",
        description: "Cuéntale algo útil a tus vecinos.",
        ctaLabel: "Participar",
        href: "/community",
      });
    }
    return list;
  }, [isFeatureEnabled]);

  const quickActions = useMemo(() => {
    const items: {
      id: string;
      label: string;
      icon: string;
      onClick: () => void;
    }[] = [];
    if (isFeatureEnabled("experiences")) {
      items.push({
        id: "join",
        label: "Unirme",
        icon: "◎",
        onClick: () => router.push("/discover?segment=experiences"),
      });
    }
    if (isFeatureEnabled("resources")) {
      items.push({
        id: "reserve",
        label: "Reservar",
        icon: "▣",
        onClick: () => router.push("/resources"),
      });
    }
    if (isFeatureEnabled("incidents")) {
      items.push({
        id: "report",
        label: "Avisar",
        icon: "📷",
        onClick: () => router.push("/report"),
      });
    }
    return items;
  }, [isFeatureEnabled, router]);

  return (
    <div className="space-y-10 pb-4">
      <TerritoryHero
        territoryName={theme.logoText}
        greeting={greeting}
        contextLabel={contextLabel}
        weatherLabel={weatherLabel}
        imageUrl={theme.imagery.homeHero}
        notificationCount={3}
        onNotifications={() => router.push("/me")}
      />

      <QuickActionBar items={quickActions} />

      <section className="space-y-4">
        <div>
          <h2 className="text-[22px] font-semibold leading-7 text-[var(--color-text-primary)]">
            Pulso de la comunidad
          </h2>
          <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
            Qué está pasando ahora en tu territorio.
          </p>
        </div>
        {pulseItems.length === 0 ? (
          <p className="rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-6 text-[16px] text-[var(--color-text-secondary)] shadow-[var(--shadow-elev-1)]">
            Hoy está tranquilo. Explora una actividad o reserva un espacio.
          </p>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {pulseItems.map((item) => (
              <CommunityPulseCard
                key={item.id}
                eyebrow={item.eyebrow}
                title={item.title}
                meta={item.meta}
                imageUrl={item.imageUrl}
                tone={item.tone}
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>
        )}
      </section>

      {invitations.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-[22px] font-semibold leading-7">
              Participa hoy
            </h2>
            <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
              Pequeñas acciones que dan vida al lugar.
            </p>
          </div>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {invitations.map((inv) => (
              <ParticipationInvitationCard
                key={inv.id}
                title={inv.title}
                description={inv.description}
                ctaLabel={inv.ctaLabel}
                onClick={() => router.push(inv.href)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {isFeatureEnabled("feed") && official ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-[22px] font-semibold leading-7">
              Información de la comunidad
            </h2>
            <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
              Avisos útiles, no un tablón interminable.
            </p>
          </div>
          <OfficialNoticeCard
            title={official.title}
            preview={official.body}
            areaLabel={official.areaLabel}
            imageUrl={official.imageUrl}
            onClick={() => router.push(`/community/content/${official.id}`)}
          />
        </section>
      ) : null}

      <section className="space-y-5">
        <SectionHeader
          title="Para ti"
          action={
            <button
              type="button"
              className="text-[14px] font-semibold text-[var(--color-action-primary)]"
              onClick={() => router.push("/discover")}
            >
              Ver más
            </button>
          }
        />
        <p className="-mt-2 text-[15px] text-[var(--color-text-secondary)]">
          Sugerencias según tu zona, intereses y actividad.
        </p>

        {isFeatureEnabled("experiences") ? (
          <div className="space-y-4">
            {featuredExperiences.map((exp) => (
              <ExperiencePreviewCard
                key={exp.id}
                title={exp.title}
                when={formatExperienceWhen(exp.startsAt)}
                where={exp.location}
                imageUrl={exp.imageUrl}
                peopleLabel={`${exp.participantCount} personas van`}
                ctaLabel="Ver y unirme"
                onClick={() => router.push(`/experiences/${exp.id}`)}
                onCta={() => router.push(`/experiences/${exp.id}`)}
              />
            ))}
          </div>
        ) : null}

        {isFeatureEnabled("resources") ? (
          <div>
            <p className="mb-3 text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Lugares libres cerca
            </p>
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {featuredPlaces.map((place) => (
                <PlacePreviewCard
                  key={place.id}
                  name={place.name}
                  availability={place.availabilityPreview}
                  areaLabel={place.areaLabel}
                  imageUrl={place.imageUrl}
                  onClick={() => router.push(`/resources/${place.id}`)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {isFeatureEnabled("recommendations")
          ? recommendations.map((tip) => (
              <RecommendationCard
                key={tip.id}
                quote={tip.quote}
                author={tip.author}
                imageUrl={tip.imageUrl}
                className="w-full min-w-0"
              />
            ))
          : null}
      </section>
    </div>
  );
}
