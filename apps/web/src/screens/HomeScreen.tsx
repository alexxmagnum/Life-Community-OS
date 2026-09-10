"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  homeHeroIndexForHour,
  listHomeHeroSlideUrls,
  type CommunityContent,
} from "@life-community-os/tenant-life-panoramica";
import type {
  CommunityCommentRecord,
  CommunityPost,
  CommunityReaction,
} from "@life-community-os/types";
import {
  communityFeedItemHref,
  communityFeedPrimaryLabel,
  communityFeedTimeLabel,
  experienceKindProductLabel,
  isLivingMomentFeedItem,
  normalizeExperienceKind,
  territoryHomeQuery,
  type CommunityFeedItem,
} from "@life-community-os/types";
import {
  HomeDiscoverCard,
  HomeHeroStage,
  HomeMakeItHappen,
  HomeParticipateCard,
  HomeRail,
  HomeSectionHead,
  HomeTodayFeaturedCard,
  HomeTodaySideCard,
  HomeTodayTabs,
  type HomeHeroSlide,
  type HomeMakeItHappenAction,
  type HomeTodayTabId,
} from "@life-community-os/ui";
import {
  fetchCommunityFeed,
  fetchCommunityHome,
  getCommunityExperienceFeed,
} from "@/lib/community/community-client";
import { postToHubContent } from "@/lib/community/map-to-ui";
import { fetchTerritoryAnnouncements } from "@/lib/community/community-operations-client";
import {
  openActionComposer,
  openActionComposerWithIntent,
} from "@/lib/community/action-composer-client";
import { locationCardImageUrl, communityFeedCardImageUrl } from "@/lib/location/location-card-asset";
import { LifePlaceHost } from "@/components/life-place/LifePlaceHost";
import { useTenantLocations } from "@/lib/location";
import { preferEntityMediaUrl } from "@/lib/media/media-policy";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

function resolveCopyTemplate(template: string, territoryName: string) {
  return template.replaceAll("{territory}", territoryName);
}

function madridHour(nowMs = Date.now()): number {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  }).format(new Date(nowMs));
  return Number(hourStr);
}

function salutationForHour(hour: number): string {
  if (hour < 12) return "Buenos días,";
  if (hour < 20) return "Buenas tardes,";
  return "Buenas noches,";
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function itemInPeriod(
  item: CommunityFeedItem,
  period: HomeTodayTabId,
  nowMs: number,
): boolean {
  if (!item.startsAt) return period === "today";
  const starts = new Date(item.startsAt).getTime();
  if (Number.isNaN(starts)) return false;
  const today = startOfLocalDay(new Date(nowMs)).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (period === "today") {
    return starts >= today && starts < today + dayMs;
  }
  if (period === "week") {
    return starts >= today && starts < today + 7 * dayMs;
  }
  return starts >= today && starts < today + 31 * dayMs;
}

function feedBadge(item: CommunityFeedItem): string {
  const kind = item.metadata?.experienceKind
    ? normalizeExperienceKind(item.metadata.experienceKind)
    : item.type === "event"
      ? "event"
      : item.type === "experience"
        ? "experience"
        : null;
  if (kind) return experienceKindProductLabel(kind).toUpperCase();
  const loc = item.metadata?.locationLabel?.trim();
  if (loc) return loc.slice(0, 18).toUpperCase();
  return "HOY";
}

function peopleLabelFor(item: CommunityFeedItem): string | undefined {
  if (!item.capacity) return undefined;
  const occupied = item.metadata?.occupied ?? 0;
  const total = item.capacity.total;
  if (typeof total === "number" && total > 0) {
    return `${occupied}/${total}`;
  }
  if (typeof item.capacity.available === "number") {
    return `${item.capacity.available} libres`;
  }
  return undefined;
}

/**
 * Home V2 — single Life Home surface.
 * Hero → Hoy → Haz que pase → Participa → Descubre.
 * Consumes Experience.kind via Community Experience Feed. No fake content.
 */
export function HomeScreen() {
  const router = useRouter();
  const {
    theme,
    isFeatureEnabled,
    hasCapability,
    configuration,
    authenticated,
    hasMembership,
  } = useTenant();
  const { currentUser, sessionReady } = useCurrentUser();
  const { context: activeTerritory } = useTerritory();
  const { allLocations } = useTenantLocations(
    configuration.tenantId,
    activeTerritory.territoryId,
  );
  const homeQuery = territoryHomeQuery(activeTerritory);

  const [feedItems, setFeedItems] = useState<CommunityFeedItem[]>([]);
  const [feedReady, setFeedReady] = useState(false);
  const [proposals, setProposals] = useState<CommunityContent[]>([]);
  const [debates, setDebates] = useState<CommunityContent[]>([]);
  const [placeLocationId, setPlaceLocationId] = useState<string | null>(null);
  const [todayTab, setTodayTab] = useState<HomeTodayTabId>("today");
  const [hour, setHour] = useState(() => madridHour());
  const [nowMs, setNowMs] = useState(() => Date.now());

  const territoryName =
    activeTerritory.territoryName ??
    theme.identity?.territoryName ??
    theme.logoText;
  const placeName = theme.shortName || territoryName;
  const canLocal =
    isFeatureEnabled("localLife") && hasCapability(CAPABILITIES.localView);

  useEffect(() => {
    setHour(madridHour());
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const territoryId = homeQuery.territoryId;
    if (!sessionReady) return;
    setFeedReady(false);
    setProposals([]);
    setDebates([]);

    // Visitors resolve Home without waiting on member feed APIs.
    if (!authenticated || !hasMembership) {
      setFeedItems([]);
      setFeedReady(true);
      if (territoryId) {
        void fetchTerritoryAnnouncements({
          tenantId: configuration.tenantId,
          territoryId,
        });
        void fetchCommunityHome({
          tenantId: configuration.tenantId,
          territoryId,
        }).then((home) => {
          if (cancelled || !home) return;
          setFeedItems([
            ...home.moments,
            ...home.currentActivities,
            ...home.upcomingActivities,
          ]);
        });
      }
      return;
    }

    const applyParticipateFromFeed = async () => {
      if (!territoryId) return;
      const data = await fetchCommunityFeed(configuration.tenantId, {
        territoryId,
      });
      if (cancelled) return;
      const posts = (data.posts ?? []) as CommunityPost[];
      const comments = (data.comments ?? []) as CommunityCommentRecord[];
      const reactions = (data.reactions ?? []) as CommunityReaction[];
      const mapped = posts
        .filter((post) => post.status === "published")
        .map((post) => postToHubContent(post, comments, reactions));
      setProposals(
        mapped
          .filter((item) => item.type === "proposal")
          .slice(0, 4),
      );
      setDebates(
        mapped
          .filter((item) => item.type === "discussion")
          .slice(0, 4),
      );
    };

    void fetchCommunityHome({
      tenantId: configuration.tenantId,
      territoryId,
    }).then((home) => {
      if (cancelled) return;
      if (home) {
        setFeedItems([
          ...home.moments,
          ...home.currentActivities,
          ...home.upcomingActivities,
        ]);
        setFeedReady(true);
        void applyParticipateFromFeed();
        return;
      }
      if (!territoryId) {
        setFeedItems([]);
        setFeedReady(true);
        return;
      }
      void getCommunityExperienceFeed({
        tenantId: configuration.tenantId,
        territoryId,
      }).then((data) => {
        if (cancelled) return;
        setFeedItems(data.items);
        setFeedReady(true);
      });
      void applyParticipateFromFeed();
    }).catch(() => {
      if (cancelled) return;
      setFeedItems([]);
      setFeedReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    sessionReady,
    authenticated,
    hasMembership,
    configuration.tenantId,
    homeQuery.territoryId,
  ]);

  const todayTitle = resolveCopyTemplate(
    theme.identity?.pulseTitleTemplate ?? "Hoy en {territory}",
    placeName,
  );

  const salutation = salutationForHour(hour);
  // Never use territory as personName. Salutation alone if no real person name.
  const heroPersonName =
    currentUser.displayName?.trim() ||
    (authenticated
      ? currentUser.email?.split("@")[0]?.trim() || undefined
      : undefined);

  // Dev-only visual harness for Hero geometry vs TARGET. Never production.
  // Applied after mount (SSR-safe). Capture scripts wait for "Alex".
  const [heroVisualHarness, setHeroVisualHarness] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    try {
      setHeroVisualHarness(
        new URLSearchParams(window.location.search).get("heroVisual") === "alex",
      );
    } catch {
      setHeroVisualHarness(false);
    }
  }, []);

  const heroGreeting = heroVisualHarness ? "Buenas tardes," : salutation;
  const heroName = heroVisualHarness ? "Alex" : heroPersonName;

  const heroSlides = useMemo((): HomeHeroSlide[] => {
    const sources = listHomeHeroSlideUrls(theme.imagery);
    return sources.map((imageUrl, index) => ({
      id: `hero-${index}`,
      imageUrl,
      alt: territoryName,
    }));
  }, [territoryName, theme.imagery]);

  const livingMoments = useMemo(() => {
    if (!feedReady) return [];
    return feedItems.filter(
      (item) =>
        item.type === "experience" ||
        item.type === "event" ||
        isLivingMomentFeedItem(item),
    );
  }, [feedReady, feedItems]);

  const periodItems = useMemo(() => {
    // Strict temporal window — no fallthrough into other periods.
    return livingMoments.filter((item) =>
      itemInPeriod(item, todayTab, nowMs),
    );
  }, [livingMoments, todayTab, nowMs]);

  const featured = periodItems[0];
  const sideCards = periodItems.slice(1, 3);

  // Dev-only visual density for Hoy geometry (not product DEMO / not DB).
  const [todayVisualHarness, setTodayVisualHarness] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    try {
      const q = new URLSearchParams(window.location.search);
      setTodayVisualHarness(
        q.get("todayVisual") === "1" || q.get("homeVisual") === "hoy",
      );
    } catch {
      setTodayVisualHarness(false);
    }
  }, []);

  const openFeedItem = (item: CommunityFeedItem) => {
    router.push(communityFeedItemHref(item));
  };

  const discoverPlaces = useMemo(() => {
    if (!canLocal) return [];
    return allLocations
      .filter((loc) => loc.visibility !== "private")
      .slice(0, 4)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        imageUrl:
          preferEntityMediaUrl(undefined, loc.imageUrl) ||
          locationCardImageUrl(loc),
        category: loc.category,
        areaLabel: loc.areaLabel,
      }));
  }, [canLocal, allLocations]);

  const makeActions = useMemo((): HomeMakeItHappenAction[] => {
    const actions: HomeMakeItHappenAction[] = [
      {
        id: "plan",
        label: "Crear plan",
        tone: "plan",
        onClick: () =>
          openActionComposerWithIntent("plan_create", { source: "home" }),
      },
      {
        id: "experience",
        label: "Crear experiencia",
        tone: "experience",
        onClick: () =>
          openActionComposerWithIntent("experience_create", { source: "home" }),
      },
      {
        id: "event",
        label: "Crear evento",
        tone: "event",
        onClick: () =>
          openActionComposerWithIntent("event_create", { source: "home" }),
      },
      {
        id: "announce",
        label: "Publicar aviso",
        tone: "announce",
        onClick: () =>
          openActionComposerWithIntent("announcement_create", {
            source: "home",
          }),
      },
      {
        id: "market",
        label: "Vender algo",
        tone: "market",
        onClick: () =>
          openActionComposerWithIntent("marketplace_listing", {
            source: "home",
          }),
      },
      {
        id: "more",
        label: "Más acciones",
        tone: "more",
        onClick: () => openActionComposer({ source: "home" }),
      },
    ];
    return actions;
  }, []);

  const makeHeroImage =
    heroSlides[1]?.imageUrl ?? heroSlides[0]?.imageUrl ?? undefined;

  return (
    <div className="relative bg-[var(--life-bg,#050708)] pb-8">
      <HomeHeroStage
        slides={heroSlides}
        greeting={heroGreeting}
        personName={heroName}
        initialIndex={homeHeroIndexForHour(hour)}
        underChrome
      />

      {/* HOY */}
      <section className="mt-4 px-5 max-[390px]:px-4" aria-labelledby="home-today-heading">
        <HomeSectionHead
          accent
          title={todayTitle}
          actionLabel="Ver todo"
          onAction={() => router.push("/experiences")}
        />
        <span id="home-today-heading" className="sr-only">
          {todayTitle}
        </span>
        <HomeTodayTabs activeId={todayTab} onChange={setTodayTab} />

        {!feedReady ? (
          <div
            className="grid h-[214px] gap-2.5"
            style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}
          >
            <HomeTodayFeaturedCard devPlaceholder />
            <div className="flex min-h-0 min-w-0 flex-col gap-2">
              <HomeTodaySideCard devPlaceholder />
              <HomeTodaySideCard devPlaceholder />
            </div>
          </div>
        ) : todayVisualHarness ? (
          /* Dev visual harness — density fixture only. Not product / not DEMO. */
          <div
            className="grid h-[214px] gap-2.5"
            style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}
            data-today-visual-harness="1"
          >
            <HomeTodayFeaturedCard
              badgeLabel="PLAN"
              title="Fixture visual DEV"
              locationLabel="Geometría de composición"
              peopleLabel="Cupo · fixture DEV"
              timeLabel="Fixture · densificación"
              ctaLabel="Ver"
              imageUrl="/tenants/life-panoramica/hero/hero-afternoon.png"
            />
            <div className="flex min-h-0 min-w-0 flex-col gap-2">
              <HomeTodaySideCard
                badgeLabel="DEV"
                title="Slot visual A"
                timeLabel="Fixture · tarde"
                imageUrl="/tenants/life-panoramica/intents/bg-dining.png"
              />
              <HomeTodaySideCard
                badgeLabel="DEV"
                title="Slot visual B"
                timeLabel="Fixture · noche"
                imageUrl="/tenants/life-panoramica/hero/hero-evening.png"
              />
            </div>
          </div>
        ) : (
          <div
            className="grid h-[214px] gap-2.5"
            style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}
          >
            {featured ? (
              <HomeTodayFeaturedCard
                badgeLabel={feedBadge(featured)}
                title={featured.title}
                locationLabel={
                  featured.metadata?.locationLabel || undefined
                }
                peopleLabel={peopleLabelFor(featured)}
                timeLabel={communityFeedTimeLabel(featured) || undefined}
                imageUrl={communityFeedCardImageUrl(featured) || undefined}
                ctaLabel={communityFeedPrimaryLabel(featured)}
                onClick={() => openFeedItem(featured)}
                onCta={() => openFeedItem(featured)}
              />
            ) : (
              <HomeTodayFeaturedCard devPlaceholder />
            )}
            <div className="flex min-h-0 min-w-0 flex-col gap-2">
              {[0, 1].map((slot) => {
                const item = sideCards[slot];
                if (item) {
                  return (
                    <HomeTodaySideCard
                      key={item.id}
                      badgeLabel={feedBadge(item)}
                      title={item.title}
                      timeLabel={communityFeedTimeLabel(item) || undefined}
                      imageUrl={
                        communityFeedCardImageUrl(item) || undefined
                      }
                      onClick={() => openFeedItem(item)}
                    />
                  );
                }
                return (
                  <HomeTodaySideCard
                    key={`hoy-dev-side-${slot}`}
                    devPlaceholder
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* HAZ QUE PASE */}
      <section className="mt-10 px-4" aria-labelledby="home-make-heading">
        <HomeSectionHead
          accent
          title="Haz que pase"
          actionLabel="Ver todas las acciones"
          onAction={() => openActionComposer({ source: "home" })}
        />
        <span id="home-make-heading" className="sr-only">
          Haz que pase
        </span>
        <HomeMakeItHappen
          imageUrl={makeHeroImage}
          onCreate={() =>
            openActionComposerWithIntent("plan_create", { source: "home" })
          }
          actions={makeActions}
        />
      </section>

      {/* PARTICIPA */}
      <section className="mt-10 px-4" aria-labelledby="home-participate-heading">
        <HomeSectionHead
          accent
          title="Participa"
          actionLabel="Ver todo"
          onAction={() => router.push("/community?tab=propuestas")}
        />
        <span id="home-participate-heading" className="sr-only">
          Participa
        </span>
        {proposals.length === 0 && debates.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-5 text-[14px] text-white/55">
            Todavía no hay propuestas ni debates abiertos en {placeName}.
          </p>
        ) : (
          <HomeRail>
            {proposals.map((item) => {
              const supports =
                (item.reactionCounts.support ?? 0) +
                (item.reactionCounts.acknowledge ?? 0);
              return (
                <HomeParticipateCard
                  key={item.id}
                  kind="proposal"
                  title={item.title}
                  metaLabel={
                    supports > 0 ? `${supports} apoyos` : undefined
                  }
                  statusLabel={
                    item.decisionStatus === "closing_soon"
                      ? "Cierra pronto"
                      : item.decisionStatus === "open"
                        ? undefined
                        : item.decisionStatus === "closed"
                          ? "Cerrada"
                          : undefined
                  }
                  ctaLabel="Apoyar"
                  onClick={() =>
                    router.push(`/community/content/${item.id}`)
                  }
                />
              );
            })}
            {debates.map((item) => (
              <HomeParticipateCard
                key={item.id}
                kind="debate"
                title={item.title}
                statusLabel={
                  item.status === "archived" ? "CERRADO" : "ABIERTO"
                }
                ctaLabel="Participar"
                onClick={() => router.push(`/community/content/${item.id}`)}
              />
            ))}
          </HomeRail>
        )}
      </section>

      {/* DESCUBRE */}
      <section className="mt-10 px-4" aria-labelledby="home-discover-heading">
        <HomeSectionHead
          accent
          title="Descubre"
          actionLabel="Ver todo"
          onAction={() => router.push("/discover")}
        />
        <span id="home-discover-heading" className="sr-only">
          Descubre
        </span>
        {discoverPlaces.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-5 text-[14px] text-white/55">
            Explora el territorio cuando haya lugares publicados.
          </p>
        ) : (
          <div className="space-y-3">
            {discoverPlaces.slice(0, 1).map((place) => (
              <HomeDiscoverCard
                key={place.id}
                badgeLabel={place.category?.toUpperCase()}
                title={place.name}
                subtitle={
                  place.areaLabel
                    ? `${place.areaLabel} · Desde ${placeName}`
                    : placeName
                }
                imageUrl={place.imageUrl}
                ctaLabel="Ver lugar"
                onClick={() => {
                  setPlaceLocationId(place.id);
                }}
              />
            ))}
            {discoverPlaces.length > 1 ? (
              <div className="flex justify-center gap-1.5 pt-1" aria-hidden>
                {discoverPlaces.slice(0, 4).map((place, index) => (
                  <span
                    key={place.id}
                    className={cnDot(index === 0)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <LifePlaceHost
        tenantId={configuration.tenantId}
        territoryId={homeQuery.territoryId}
        locationId={placeLocationId}
        onClose={() => setPlaceLocationId(null)}
      />
    </div>
  );
}

function cnDot(active: boolean): string {
  return active
    ? "h-1.5 w-1.5 rounded-full bg-[var(--color-accent-cyan)]"
    : "h-1.5 w-1.5 rounded-full bg-white/25";
}
