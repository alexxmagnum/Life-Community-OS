"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  buildCommunityPulse,
  formatExperienceWhen,
  getHomeSponsorSlot,
  listDiscoverableExperiences,
  listNearYou,
  searchHomeCatalog,
} from "@life-community-os/tenant-life-panoramica";
import type { CommunityActivitySource } from "@life-community-os/types";
import {
  CommunityActivityCard,
  CommunityPulseMoment,
  ExperiencePreviewCard,
  GlobalAppSearch,
  HomeSection,
  LocalLifeRail,
  LocalPlaceCard,
  QuickActionBar,
  SponsoredFeedCard,
  TerritoryHero,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function greetingFor(name: string) {
  return `Hola, ${name}`;
}

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
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

function openCreateSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("lcos:open-create"));
  }
}

/** Prefer life over administration in editorial order. */
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

export function HomeScreen() {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability, demoMember } = useTenant();
  const [query, setQuery] = useState("");

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

  const canPulse =
    isFeatureEnabled("communityPulse") &&
    hasCapability(CAPABILITIES.pulseView);

  const canLocal =
    isFeatureEnabled("localLife") &&
    hasCapability(CAPABILITIES.localView);

  const searchHits = useMemo(
    () => (query.trim().length >= 2 ? searchHomeCatalog(query, 8) : []),
    [query],
  );

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

  const quickActions = useMemo(() => {
    const items: {
      id: string;
      label: string;
      icon: ReactNode;
      hint?: string;
      onClick: () => void;
    }[] = [];

    if (
      isFeatureEnabled("resources") &&
      hasCapability(CAPABILITIES.resourceReserve)
    ) {
      items.push({
        id: "reserve",
        label: "Reservar",
        hint: "Pistas y salones",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="m9 15 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        onClick: () => router.push("/resources"),
      });
    }
    if (isFeatureEnabled("experiences")) {
      items.push({
        id: "events",
        label: "Eventos",
        hint: "Planes de hoy",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="m12 13 1.1 2.2 2.4.3-1.8 1.7.5 2.4L12 18.4 9.8 19.6l.5-2.4-1.8-1.7 2.4-.3L12 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
        onClick: () => router.push("/discover"),
      });
    }
    if (isFeatureEnabled("marketplace")) {
      items.push({
        id: "market",
        label: "Mercado",
        hint: "Entre vecinos",
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.7L6 4H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="20" r="1" fill="currentColor" />
            <circle cx="17" cy="20" r="1" fill="currentColor" />
          </svg>
        ),
        onClick: () => router.push("/marketplace"),
      });
    }
    items.push({
      id: "create",
      label: "Crear",
      hint: "Comparte algo",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      onClick: openCreateSheet,
    });
    return items.slice(0, 4);
  }, [hasCapability, isFeatureEnabled, router]);

  const searchSuggestions = useMemo(() => {
    const chips: { id: string; label: string; onClick: () => void }[] = [];
    if (isFeatureEnabled("resources")) {
      chips.push({
        id: "chip-padel",
        label: "Pádel",
        onClick: () => setQuery("pádel"),
      });
    }
    if (isFeatureEnabled("experiences")) {
      chips.push({
        id: "chip-paseo",
        label: "Paseos",
        onClick: () => setQuery("paseo"),
      });
    }
    if (isFeatureEnabled("marketplace")) {
      chips.push({
        id: "chip-market",
        label: "Mercado",
        onClick: () => router.push("/marketplace"),
      });
    }
    chips.push({
      id: "chip-create",
      label: "Crear",
      onClick: openCreateSheet,
    });
    return chips;
  }, [isFeatureEnabled, router]);

  return (
    <div className="space-y-4 overflow-x-hidden pb-8 md:space-y-5">
      <GlobalAppSearch
        value={query}
        onChange={setQuery}
        placeholder="Buscar planes, reservas, mercado, sitios…"
        hits={searchHits}
        onSelectHit={(hit) => {
          setQuery("");
          router.push(hit.href);
        }}
        suggestions={searchSuggestions}
      />

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-[var(--color-action-primary)]">
            {greetingFor(demoMember.displayName)}{" "}
            <span aria-hidden>👋</span>
          </h1>
          {areaLine ? (
            <p className="mt-0.5 text-[13px] font-medium text-[var(--color-text-secondary)]">
              {areaLine}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => router.push("/calendar")}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--color-action-primary)] shadow-[0_1px_2px_rgba(26,31,28,0.05)]"
        >
          Mi agenda
        </button>
      </div>

      <TerritoryHero
        variant="band"
        imageUrl={theme.imagery.homeHero}
        caption="Panorámica Golf"
      />

      {quickActions.length > 0 ? (
        <QuickActionBar items={quickActions} />
      ) : null}

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
