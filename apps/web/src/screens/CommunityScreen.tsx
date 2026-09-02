"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  communityAlertIcon,
  communityAlertTone,
  communityHubSectionIdForArea,
  formatContentWhen,
  listAccessibleChannels,
  listActiveCommunityAlerts,
  listActualidadContent,
  listEspaciosComunitarios,
  listMascotasHubItems,
  listOfficialContent,
  listOfficialEntities,
  listParticipacionContent,
  resolveCommunityBelongLayer,
  resolveCommunityHubArea,
  type CommunityBelongLayerId,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  FilterChipRow,
  HomeSection,
  HubAttentionCard,
  HubDoorCard,
  HubPanel,
  HubProposalCard,
  HubRail,
  HubRailCard,
  HubRow,
  HubTile,
  HubTileGrid,
  MobileScreen,
  type HubProposalStatus,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { useReservations } from "@/providers/ReservationProvider";
import { useTerritory } from "@/providers/TerritoryProvider";
import { channelAccessLabel } from "@/lib/demo-access-copy";
import { resolvePlaceHref } from "@/lib/location";
import { fetchTerritoryAnnouncements } from "@/lib/community/community-operations-client";
import type { CommunityEvent, CommunityFeedItem, CommunityGroupRecord, CommunityOwnActivity, TerritoryAnnouncement } from "@life-community-os/types";
import {
  COMMUNITY_GROUPS_EMPTY_CTA,
  COMMUNITY_GROUPS_EMPTY_DESCRIPTION,
  COMMUNITY_GROUPS_EMPTY_TITLE,
  COMMUNITY_HELP_EMPTY_CTA,
  COMMUNITY_HELP_EMPTY_DESCRIPTION,
  COMMUNITY_HELP_EMPTY_TITLE,
  COMMUNITY_NOW_EMPTY_DESCRIPTION,
  COMMUNITY_NOW_EMPTY_TITLE,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_DESCRIPTION,
  COMMUNITY_OFFICIAL_ANNOUNCEMENTS_TITLE,
  helpHrefForCategory,
  LIVING_EMPTY_CTA,
  partitionLivingCommunityFeed,
} from "@life-community-os/types";
import { groupToHubCard } from "@/lib/community/map-to-ui";
import { LivingFeedCard } from "@/components/community/LivingFeedCard";
import { openActionComposerWithIntent } from "@/lib/community/action-composer-client";
import { CommunityActivationPanel } from "@/components/community/CommunityActivationPanel";
import {
  ANNOUNCEMENT_EMPTY_GLYPH,
  EXPERIENCE_EMPTY_GLYPH,
  GROUP_EMPTY_GLYPH,
  HELP_EMPTY_GLYPH,
} from "@/lib/community/composer-glyphs";
import { LifePlaceHost } from "@/components/life-place/LifePlaceHost";
import { CommunityPreviewPanel } from "@/components/community/CommunityPreviewPanel";
import { resolveMembershipAccessScope } from "@/lib/membership/membership-experience-scope";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

const PLAZA_PEEK = 4;
const OFFICIAL_CHANNEL_PEEK = 3;

function proposalStatus(status?: string): HubProposalStatus {
  if (status === "closing_soon") return "closing_soon";
  if (status === "closed") return "closed";
  return "open";
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Community Hub — Belong surface (Ahora · Grupos · Proponer · Oficial).
 *
 * Scroll layers keep plaza-* DOM ids for deep-link compatibility.
 * Content ownership:
 *   Ahora     → alerts + actualidad + recent activity (existing feed)
 *   Grupos    → groups → detail/conversation routes
 *   Proponer  → open proposals (no invented voting)
 *   Oficial   → entities, notices, channels
 * Housing door → /housing when module + feature + housing.view (not Belong)
 * Explorar portal: gated (not a Belong peer); anchor kept for ?tab=
 */
export function CommunityHubScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    personId,
    theme,
    configuration,
    tenantSlug,
    homeMode,
    isProductCapabilityEnabled,
  } = useTenant();
  const { context: activeTerritory } = useTerritory();
  const { feedItems, getContent } = useCommunityInteractions();
  const { experiences } = useReservations();
  const premiumHome = homeMode === "premium";
  const tenantId = configuration.tenantId;
  const [domainGroups, setDomainGroups] = useState<CommunityGroupRecord[]>([]);
  const [domainEvents, setDomainEvents] = useState<CommunityEvent[]>([]);
  const [experienceFeed, setExperienceFeed] = useState<CommunityFeedItem[]>([]);
  const [territoryAnnouncements, setTerritoryAnnouncements] = useState<
    TerritoryAnnouncement[]
  >([]);
  const [ownActivity, setOwnActivity] = useState<CommunityOwnActivity | null>(
    null,
  );

  const [placeLocationId, setPlaceLocationId] = useState<string | null>(null);
  const [expandGroups, setExpandGroups] = useState(false);
  const [expandPlaza, setExpandPlaza] = useState(false);
  const [expandActualidad, setExpandActualidad] = useState(false);
  const [expandChannels, setExpandChannels] = useState(false);
  const [petsOpen, setPetsOpen] = useState(false);

  const { currentUser } = useCurrentUser();
  const accessScope = useMemo(
    () =>
      resolveMembershipAccessScope({
        authenticated: currentUser.authenticated,
        hasMembership: currentUser.hasMembership,
        membershipStatus: currentUser.membershipStatus,
        role: currentUser.role,
      }),
    [
      currentUser.authenticated,
      currentUser.hasMembership,
      currentUser.membershipStatus,
      currentUser.role,
    ],
  );

  const canView = hasCapability(CAPABILITIES.contentView);
  const canChannels = hasCapability(CAPABILITIES.channelView);
  const canCreate =
    isFeatureEnabled("feed") && hasCapability(CAPABILITIES.contentCreate);

  const communityOn = isModuleEnabled("community");

  const feedById = useMemo(
    () => new Map(feedItems.map((item) => [item.id, item])),
    [feedItems],
  );

  const alerts = useMemo(
    () => (premiumHome ? listActiveCommunityAlerts() : []),
    [premiumHome],
  );

  /** Participation items — proposals open or about to close. */
  const participation = useMemo(() => {
    if (!premiumHome) return [] as typeof feedItems;
    return listParticipacionContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById, premiumHome]);

  /** Layer 1 — decisions with a deadline are the only promoted proposals. */
  const closingSoon = useMemo(
    () => participation.filter((c) => c.decisionStatus === "closing_soon"),
    [participation],
  );

  /** Layer 2 — single source for neighbour life. Official never enters here. */
  const plazaItems = useMemo(() => {
    return feedItems.filter((c) => !c.isOfficial && c.type !== "proposal");
  }, [feedItems]);

  /** Ahora — actualidad catalog (existing), live titles via feed. */
  const actualidadItems = useMemo(() => {
    if (!premiumHome) {
      return feedItems.filter((c) => Boolean(c.isOfficial));
    }
    return listActualidadContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById, feedItems, premiumHome]);

  /** Official notices — full Belong Oficial list (existing catalog). */
  const officialNotices = useMemo(() => {
    if (!premiumHome) return [] as typeof feedItems;
    return listOfficialContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById, premiumHome]);

  const groupItems = useMemo(
    () => domainGroups.map(groupToHubCard),
    [domainGroups],
  );

  useEffect(() => {
    if (!communityOn) return;
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams({ tenantId: tenantSlug });
      if (activeTerritory.territoryId) {
        params.set("territoryId", activeTerritory.territoryId);
      }
      const res = await fetch(`/api/community/feed?${params.toString()}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { "x-tenant-slug": tenantSlug },
        },
      );
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as {
        groups?: CommunityGroupRecord[];
        events?: CommunityEvent[];
        items?: CommunityFeedItem[];
      };
      setDomainGroups(data.groups ?? []);
      setDomainEvents(data.events ?? []);
      setExperienceFeed(data.items ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, communityOn, activeTerritory.territoryId]);

  useEffect(() => {
    let cancelled = false;
    void fetchTerritoryAnnouncements({
      tenantId: tenantSlug,
      territoryId: activeTerritory.territoryId,
    }).then((rows) => {
      if (!cancelled) setTerritoryAnnouncements(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, activeTerritory.territoryId]);

  useEffect(() => {
    if (!personId) {
      setOwnActivity(null);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/community/activity?tenantId=${encodeURIComponent(tenantSlug)}`,
      {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-tenant-slug": tenantSlug },
      },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { activity?: CommunityOwnActivity } | null) => {
        if (!cancelled) setOwnActivity(data?.activity ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [personId, tenantSlug]);

  const living = useMemo(
    () => partitionLivingCommunityFeed(experienceFeed),
    [experienceFeed],
  );
  const accessibleChannels = useMemo(
    () => (premiumHome && personId ? listAccessibleChannels(personId) : []),
    [personId, premiumHome],
  );
  const espacios = useMemo(
    () => (premiumHome ? listEspaciosComunitarios() : []),
    [premiumHome],
  );
  const officialEntities = useMemo(
    () => (premiumHome ? listOfficialEntities() : []),
    [premiumHome],
  );
  const experienceCount = experiences.length;
  const mascotasItems = useMemo(() => {
    if (!premiumHome) return [];
    try {
      return listMascotasHubItems();
    } catch {
      return [];
    }
  }, [premiumHome]);

  const tabParam = searchParams.get("tab");
  const resolvedTab = resolveCommunityHubArea(tabParam);
  /**
   * Belong chip highlight. Plain `/community` defaults to Ahora.
   * Explorar tabs (`espacios`, `mascotas`) leave no Belong chip forced.
   */
  const activeBelongLayer: CommunityBelongLayerId | "" =
    resolveCommunityBelongLayer(tabParam) ?? (tabParam ? "" : "ahora");

  useEffect(() => {
    // Deep links (?tab=) jump to a layer. Plain /community stays at top.
    if (!tabParam || !resolvedTab) {
      const t = window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 0);
      return () => window.clearTimeout(t);
    }

    // Every canonical area keeps a landing layer — section map lives in
    // community-hub (Belong compatibility). Areas are never rewritten here.
    if (resolvedTab === "grupos") setExpandGroups(true);
    if (resolvedTab === "actualidad" || resolvedTab === "conversaciones") {
      setExpandPlaza(true);
      setExpandActualidad(true);
    }
    if (resolvedTab === "mascotas") setPetsOpen(true);

    const id = communityHubSectionIdForArea(resolvedTab);
    const t = window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [resolvedTab, tabParam]);

  if (!communityOn) {
    return (
      <EmptyState
        title="La comunidad está viva"
        description="Aún no hay funciones de participación activadas."
      />
    );
  }

  if (!canView) {
    const previewHint =
      accessScope.scope === "pending"
        ? "pending"
        : accessScope.scope === "registered"
          ? "registered"
          : accessScope.scope === "visitor"
            ? "visitor"
            : null;
    if (previewHint) {
      return (
        <MobileScreen dense>
          <CommunityPreviewPanel membershipHint={previewHint} />
        </MobileScreen>
      );
    }
    return (
      <EmptyState
        title="Sin acceso"
        description="El contenido de la comunidad no está disponible para tu cuenta."
      />
    );
  }

  const openExperienceComposer = () =>
    openActionComposerWithIntent("experience_create", { source: "global_plus" });
  const openGroupComposer = () =>
    openActionComposerWithIntent("group_create", { source: "global_plus" });
  const openHelpComposer = () =>
    openActionComposerWithIntent("help_request", { source: "global_plus" });
  const openAnnouncementComposer = () =>
    openActionComposerWithIntent("announcement_create", {
      source: "global_plus",
    });

  const communityName = theme.shortName || theme.name;

  const showChannels =
    canChannels &&
    (isFeatureEnabled("communityChannels") ||
      isFeatureEnabled("officialChannels")) &&
    accessibleChannels.length > 0;
  const showSpaces =
    (isModuleEnabled("reservations") || isModuleEnabled("community")) &&
    espacios.length > 0;
  const showPets =
    (isModuleEnabled("community.pets") || resolvedTab === "mascotas") &&
    mascotasItems.length > 0;
  const showExperiences = isFeatureEnabled("experiences") && experienceCount > 0;
  const showServices = isModuleEnabled("services");
  /**
   * Housing door only (D13 closed for Life Panoramica entry).
   * Housing remains an independent SaaS module — Community does not own it.
   * Gate: module registry + feature flag + view capability.
   */
  const showHousing =
    isModuleEnabled("housing") &&
    isFeatureEnabled("housing") &&
    isProductCapabilityEnabled("housing") &&
    hasCapability(CAPABILITIES.housingView);
  const showOfficial =
    officialEntities.length > 0 ||
    officialNotices.length > 0 ||
    territoryAnnouncements.length > 0 ||
    showChannels;
  /**
   * C.3.1 — Community Explorar must not compete as a Belong peer
   * (IA_DECISION: not a global module portal). Keep tile logic for rollback /
   * later C.3.2 ownership moves; hide the portal visually. `plaza-explore`
   * stays mounted so `?tab=espacios|mascotas` deep links still resolve.
   * Housing uses its own Community door — not this Explorar portal.
   */
  const explorePortalReady = false;
  const explorePortalContent =
    showExperiences || showSpaces || showServices || showPets;
  const showExplore = explorePortalReady && explorePortalContent;

  const attentionCount = alerts.length + closingSoon.length;

  /** Header state line — qualitative, never a module dashboard. */
  const stateLine =
    attentionCount > 0
      ? [
          alerts.length > 0
            ? plural(alerts.length, "aviso activo", "avisos activos")
            : null,
          closingSoon.length > 0
            ? plural(
                closingSoon.length,
                "decisión que cierra pronto",
                "decisiones que cierran pronto",
              )
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : living.moments.length > 0
        ? "Lo que está pasando"
        : COMMUNITY_NOW_EMPTY_TITLE;

  const visibleChannels = expandChannels
    ? accessibleChannels
    : accessibleChannels.slice(0, OFFICIAL_CHANNEL_PEEK);

  /** Ahora — full ownership of actualidad + activity (deduped; existing feed). */
  const actualidadIds = new Set(actualidadItems.map((item) => item.id));
  const activityItems = plazaItems.filter((item) => !actualidadIds.has(item.id));
  const ahoraExpanded = expandActualidad || expandPlaza;
  const visibleActualidad = ahoraExpanded
    ? actualidadItems
    : actualidadItems.slice(0, PLAZA_PEEK);
  const visibleActivity = ahoraExpanded
    ? activityItems
    : activityItems.slice(0, PLAZA_PEEK);
  const ahoraHasBody =
    living.now.length > 0 ||
    alerts.length > 0 ||
    closingSoon.length > 0 ||
    actualidadItems.length > 0 ||
    activityItems.length > 0;
  const ahoraCanExpand =
    actualidadItems.length > PLAZA_PEEK || activityItems.length > PLAZA_PEEK;

  return (
    <MobileScreen dense>
      <header className="pt-0.5">
        <h1 className="font-sans text-[26px] font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
          Comunidad
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-tertiary)]">
          {stateLine}
        </p>
        {canCreate ? (
          <Button
            variant="secondary"
            onClick={openExperienceComposer}
            className="mt-3 min-h-[44px] w-full text-[15px]"
          >
            Aportar a la comunidad
          </Button>
        ) : null}
      </header>

      {/* Belong H1 internal nav — adapters write canonical ?tab= area ids. */}
      <nav aria-label="Áreas de la comunidad" className="mt-3">
        <FilterChipRow
          items={[
            { id: "ahora", label: "Ahora" },
            { id: "proximamente", label: "Próximamente" },
            { id: "grupos", label: "Grupos" },
            { id: "ayudas", label: "Ayudas" },
            { id: "yo", label: "Mis actividades" },
          ]}
          activeId={
            activeBelongLayer === "grupos"
              ? "grupos"
              : tabParam === "yo"
                ? "yo"
                : tabParam === "ayudas"
                  ? "ayudas"
                  : tabParam === "proximamente"
                    ? "proximamente"
                    : "ahora"
          }
          onChange={(id) => {
            const target =
              id === "grupos"
                ? "plaza-people"
                : id === "proximamente"
                  ? "plaza-events"
                  : id === "ayudas"
                    ? "plaza-help"
                    : id === "yo"
                      ? "plaza-mine"
                      : "plaza-important";
            document
              .getElementById(target)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </nav>

      {/* Housing module door — not a Belong layer; navigates to /housing. */}
      {showHousing ? (
        <div className="mt-3">
          <HubDoorCard
            title="Vivienda"
            meta="Alquiler, venta, terrenos y locales"
            fallbackInitial="V"
            onClick={() => router.push("/housing")}
          />
        </div>
      ) : null}

      {/* 1 — Ahora (Belong): alerts + actualidad + actividad reciente. */}
      <section id="plaza-important" className="scroll-mt-3">
        <span id="plaza-avisos" className="sr-only" />
        <HomeSection
          title="Ahora"
          subtitle="Lo que está ocurriendo en tu territorio."
          actionLabel={
            ahoraCanExpand
              ? ahoraExpanded
                ? "Ver menos"
                : "Ver todo"
              : undefined
          }
          onAction={
            ahoraCanExpand
              ? () => {
                  setExpandActualidad((v) => !v);
                  setExpandPlaza((v) => !v);
                }
              : undefined
          }
        >
          {!ahoraHasBody && canCreate ? (
            <div className="mb-3">
              <CommunityActivationPanel
                variant="member"
                onCreateExperience={openExperienceComposer}
                onCreateAnnouncement={openAnnouncementComposer}
                onAddBusiness={() =>
                  openActionComposerWithIntent("business_create", {
                    source: "global_plus",
                  })
                }
                onInviteNeighbors={() => router.push("/me")}
              />
            </div>
          ) : null}
          {!ahoraHasBody ? (
            <EmptyState
              title={COMMUNITY_NOW_EMPTY_TITLE}
              description={COMMUNITY_NOW_EMPTY_DESCRIPTION}
              imageUrl={EXPERIENCE_EMPTY_GLYPH}
              actionLabel={canCreate ? LIVING_EMPTY_CTA : undefined}
              onAction={canCreate ? openExperienceComposer : undefined}
            />
          ) : (
            <div className="space-y-2.5">
              {living.now.map((item, index) => (
                <LivingFeedCard
                  key={item.id}
                  item={item}
                  index={index}
                  onOpenPlace={setPlaceLocationId}
                  onOpenHref={(href) => router.push(href)}
                />
              ))}
              {alerts.map((alert) => {
                const area =
                  alert.areaLabel ??
                  alert.contextLabel.split("·").slice(1).join("·").trim();
                const windowLabel =
                  alert.timeWindowLabel ??
                  alert.contextLabel.split("·")[0]?.trim();
                const meta =
                  [
                    area ? `Zona · ${area.replace(/^Zona\s+/i, "")}` : null,
                    windowLabel,
                  ]
                    .filter(Boolean)
                    .join(" · ") || alert.contextLabel;
                return (
                  <HubAttentionCard
                    key={alert.id}
                    tone={communityAlertTone(alert.level)}
                    glyph={communityAlertIcon(alert.kind, alert.level)}
                    title={alert.title}
                    meta={meta}
                    actionLabel={
                      alert.actionLabel ??
                      (alert.href ? "Ver detalle" : undefined)
                    }
                    onClick={
                      alert.href
                        ? () => {
                            const href = alert.href!;
                            if (
                              href.includes("#plaza-avisos") ||
                              href.includes("tab=actualidad")
                            ) {
                              document
                                .getElementById("plaza-important")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              return;
                            }
                            router.push(href.split("#")[0] || href);
                          }
                        : undefined
                    }
                  />
                );
              })}

              {closingSoon.map((item) => {
                const live = getContent(item.id) ?? item;
                return (
                  <HubAttentionCard
                    key={live.id}
                    tone="important"
                    glyph="⏳"
                    title={live.title}
                    meta={`Decisión abierta · cierra pronto · ${live.author.name}`}
                    actionLabel="Ver propuesta"
                    onClick={() => router.push(`/community/content/${live.id}`)}
                  />
                );
              })}

              {actualidadItems.length > 0 ? (
                <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Actualidad
                </p>
              ) : null}
              {visibleActualidad.map((item) => {
                const live = getContent(item.id) ?? item;
                const zone =
                  live.areaLabel && live.areaLabel !== theme.name
                    ? live.areaLabel
                    : undefined;
                return (
                  <HubDoorCard
                    key={`act-${live.id}`}
                    title={live.title}
                    meta={[
                      live.author.name,
                      formatContentWhen(live.publishedAt ?? live.createdAt),
                      zone,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    imageUrl={live.imageUrl || live.author.avatarUrl}
                    fallbackInitial={live.author.name.slice(0, 1).toUpperCase()}
                    imageSide="end"
                    onClick={() => router.push(`/community/content/${live.id}`)}
                  />
                );
              })}

              {/* Legacy land for ?tab=conversaciones — activity owned by Ahora. */}
              <div id="plaza-activity" className="scroll-mt-3 space-y-2.5">
                {activityItems.length > 0 ? (
                  <>
                    <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      Actividad reciente
                    </p>
                    {visibleActivity.map((item) => {
                      const live = getContent(item.id) ?? item;
                      const zone =
                        live.areaLabel && live.areaLabel !== theme.name
                          ? live.areaLabel
                          : undefined;
                      const supports =
                        live.reactionCounts.support +
                        live.reactionCounts.acknowledge;
                      const signals =
                        [
                          supports > 0
                            ? plural(supports, "apoyo", "apoyos")
                            : null,
                          live.commentCount > 0
                            ? plural(
                                live.commentCount,
                                "comentario",
                                "comentarios",
                              )
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || undefined;
                      return (
                        <HubDoorCard
                          key={live.id}
                          title={live.title}
                          meta={[
                            live.author.name,
                            formatContentWhen(
                              live.publishedAt ?? live.createdAt,
                            ),
                            zone,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          signals={signals}
                          imageUrl={live.imageUrl || live.author.avatarUrl}
                          fallbackInitial={live.author.name
                            .slice(0, 1)
                            .toUpperCase()}
                          imageSide="end"
                          onClick={() =>
                            router.push(`/community/content/${live.id}`)
                          }
                        />
                      );
                    })}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </HomeSection>
      </section>

      {/* 2 — Grupos (Belong): list + detail/conversation entry. */}
      <section id="plaza-people" className="scroll-mt-3">
        <HomeSection
          title="Grupos"
          subtitle="Entra al grupo o a su conversación."
          actionLabel={
            groupItems.length > 0
              ? expandGroups
                ? "Ver menos"
                : "Ver todos"
              : undefined
          }
          onAction={
            groupItems.length > 0
              ? () => setExpandGroups((v) => !v)
              : undefined
          }
        >
          {groupItems.length === 0 ? (
            <EmptyState
              title={COMMUNITY_GROUPS_EMPTY_TITLE}
              description={COMMUNITY_GROUPS_EMPTY_DESCRIPTION}
              imageUrl={GROUP_EMPTY_GLYPH}
              actionLabel={canCreate ? COMMUNITY_GROUPS_EMPTY_CTA : undefined}
              onAction={canCreate ? openGroupComposer : undefined}
            />
          ) : expandGroups ? (
            <div className="space-y-2.5">
              {groupItems.map((group) => (
                <HubDoorCard
                  key={group.id}
                  title={group.name}
                  meta={`${plural(group.memberCount, "miembro", "miembros")}${
                    group.categoryLabel ? ` · ${group.categoryLabel}` : ""
                  }`}
                  imageUrl={group.imageUrl}
                  onClick={() =>
                    router.push(`/community/groups/${group.id}/conversation`)
                  }
                />
              ))}
            </div>
          ) : (
            <HubRail label="Grupos de la comunidad">
              {groupItems.map((group) => (
                <HubRailCard
                  key={group.id}
                  title={group.name}
                  meta={`${plural(group.memberCount, "miembro", "miembros")}${
                    group.categoryLabel ? ` · ${group.categoryLabel}` : ""
                  }`}
                  imageUrl={group.imageUrl}
                  onClick={() =>
                    router.push(`/community/groups/${group.id}/conversation`)
                  }
                />
              ))}
            </HubRail>
          )}
        </HomeSection>
      </section>

      <section id="plaza-events" className="scroll-mt-3">
        <HomeSection title="Próximamente" subtitle="Planes y eventos que vienen.">
          {living.upcoming.length === 0 && domainEvents.length === 0 ? (
            <EmptyState
              title={COMMUNITY_NOW_EMPTY_TITLE}
              description={COMMUNITY_NOW_EMPTY_DESCRIPTION}
              imageUrl={EXPERIENCE_EMPTY_GLYPH}
              actionLabel={canCreate ? LIVING_EMPTY_CTA : undefined}
              onAction={canCreate ? openExperienceComposer : undefined}
            />
          ) : (
            <div className="space-y-3">
              {living.upcoming.map((item, index) => (
                <LivingFeedCard
                  key={item.id}
                  item={item}
                  index={index}
                  onOpenPlace={setPlaceLocationId}
                  onOpenHref={(href) => router.push(href)}
                />
              ))}
              {living.upcoming.length === 0
                ? domainEvents.map((event) => (
                    <HubRailCard
                      key={event.id}
                      title={event.title}
                      meta={[
                        event.locationLabel,
                        formatContentWhen(event.startsAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      onClick={() => router.push("/community")}
                    />
                  ))
                : null}
            </div>
          )}
        </HomeSection>
      </section>

      <section id="plaza-help" className="scroll-mt-3">
        <HomeSection title="Ayudas" subtitle="Vecinos ayudando vecinos.">
          {living.help.length === 0 ? (
            <EmptyState
              title={COMMUNITY_HELP_EMPTY_TITLE}
              description={COMMUNITY_HELP_EMPTY_DESCRIPTION}
              imageUrl={HELP_EMPTY_GLYPH}
              actionLabel={canCreate ? COMMUNITY_HELP_EMPTY_CTA : undefined}
              onAction={canCreate ? openHelpComposer : undefined}
            />
          ) : (
            <div className="space-y-3">
              {living.help.map((item, index) => (
                <LivingFeedCard
                  key={item.id}
                  item={item}
                  index={index}
                  onOpenPlace={setPlaceLocationId}
                  onOpenHref={(href) => router.push(href)}
                />
              ))}
            </div>
          )}
        </HomeSection>
      </section>

      <section id="plaza-mine" className="scroll-mt-3">
        <HomeSection
          title="Mis actividades"
          subtitle="Solo tú ves esto."
        >
          {!ownActivity ||
          (ownActivity.experiencesCreated.length === 0 &&
            ownActivity.upcomingEvents.length === 0 &&
            ownActivity.helpOffered.length === 0 &&
            ownActivity.upcomingReservations.length === 0) ? (
            <EmptyState
              title="Aún no has participado"
              description="Únete a un plan o crea el primero desde Magic Plus."
              imageUrl={EXPERIENCE_EMPTY_GLYPH}
              actionLabel={canCreate ? LIVING_EMPTY_CTA : undefined}
              onAction={canCreate ? openExperienceComposer : undefined}
            />
          ) : (
            <div className="space-y-2">
              {ownActivity.experiencesCreated.map((item) => (
                <HubDoorCard
                  key={item.id}
                  title={item.title}
                  meta="Has creado"
                  onClick={() => router.push(item.href)}
                />
              ))}
              {ownActivity.upcomingEvents.map((item) => (
                <HubDoorCard
                  key={item.id}
                  title={item.title}
                  meta="Evento"
                  onClick={() => router.push(item.href)}
                />
              ))}
              {ownActivity.upcomingReservations.map((item) => (
                <HubDoorCard
                  key={item.id}
                  title={item.title}
                  meta="Reserva"
                  onClick={() => router.push(item.href)}
                />
              ))}
              {ownActivity.helpOffered.map((item) => (
                <HubDoorCard
                  key={item.id}
                  title={item.title}
                  meta="Has ayudado"
                  onClick={() => router.push(item.href)}
                />
              ))}
            </div>
          )}
        </HomeSection>
      </section>

      {/* 3 — Proponer (Belong): existing proposals only — no invented votes. */}
      <section id="plaza-participate" className="scroll-mt-3">
        <HomeSection
          title="Proponer"
          subtitle="Propuestas abiertas — apoyo y comentarios, sin votaciones."
        >
          {participation.length === 0 ? (
            <EmptyState
              title="Sin propuestas abiertas"
              description="Cuando la comunidad pida opinión, la verás aquí."
            />
          ) : (
            <div className="space-y-2.5">
              {participation.map((item) => {
                const live = getContent(item.id) ?? item;
                const zone =
                  live.areaLabel && live.areaLabel !== theme.name
                    ? live.areaLabel
                    : undefined;
                return (
                  <HubProposalCard
                    key={live.id}
                    title={live.title}
                    body={live.body}
                    status={proposalStatus(live.decisionStatus)}
                    meta={[live.author.name, zone].filter(Boolean).join(" · ")}
                    supportCount={
                      live.reactionCounts.support +
                      live.reactionCounts.acknowledge
                    }
                    commentCount={live.commentCount}
                    onOpen={() => router.push(`/community/content/${live.id}`)}
                  />
                );
              })}
            </div>
          )}
        </HomeSection>
      </section>

      {/* 4 — Oficial (Belong): entities, notices, channels. */}
      <section id="plaza-official" className="scroll-mt-3">
        <HomeSection
          title="Oficial"
          subtitle="Entidades, avisos y canales de la comunidad."
          actionLabel={
            showChannels && accessibleChannels.length > OFFICIAL_CHANNEL_PEEK
              ? expandChannels
                ? "Ver menos"
                : "Ver todos"
              : undefined
          }
          onAction={
            showChannels && accessibleChannels.length > OFFICIAL_CHANNEL_PEEK
              ? () => setExpandChannels((v) => !v)
              : undefined
          }
        >
          {!showOfficial ? (
            <EmptyState
              title={COMMUNITY_OFFICIAL_ANNOUNCEMENTS_TITLE}
              description={COMMUNITY_OFFICIAL_ANNOUNCEMENTS_DESCRIPTION}
              imageUrl={ANNOUNCEMENT_EMPTY_GLYPH}
              actionLabel={
                canCreate ? COMMUNITY_OFFICIAL_ANNOUNCEMENTS_CTA : undefined
              }
              onAction={canCreate ? openAnnouncementComposer : undefined}
            />
          ) : (
            <div className="space-y-2.5">
              {officialEntities.map((entity) => (
                <HubRow
                  key={entity.id}
                  tone="quiet"
                  imageUrl={entity.imageUrl}
                  glyph="🏛"
                  title={entity.name}
                  meta={entity.description}
                  onClick={() => router.push(`/official/${entity.slug}`)}
                />
              ))}

              {territoryAnnouncements.length > 0 ? (
                <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Avisos del territorio
                </p>
              ) : null}
              {territoryAnnouncements.map((item) => (
                <HubRow
                  key={item.id}
                  tone="quiet"
                  glyph="📣"
                  title={item.title}
                  meta={item.body}
                  trailingLabel={formatContentWhen(item.createdAt)}
                  onClick={() => router.push(`/community/content/${item.id}`)}
                />
              ))}

              {officialNotices.length > 0 ? (
                <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Avisos
                </p>
              ) : null}
              {officialNotices.map((item) => (
                <HubRow
                  key={item.id}
                  tone="quiet"
                  glyph="📢"
                  title={item.title}
                  meta={item.author.name}
                  trailingLabel={formatContentWhen(
                    item.publishedAt ?? item.createdAt,
                  )}
                  onClick={() => router.push(`/community/content/${item.id}`)}
                />
              ))}

              {showChannels ? (
                <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Canales
                </p>
              ) : null}
              {showChannels
                ? visibleChannels.map((channel) => {
                    const label = channelAccessLabel({
                      allowed: true,
                      reason: "accessible",
                      requiresVerifiedResidency:
                        channel.requiresVerifiedResidency,
                      type: channel.type,
                    });
                    const matchedEntity =
                      channel.type === "official"
                        ? (officialEntities.find(
                            (e) => e.id === channel.ownerId,
                          ) ??
                          officialEntities.find((e) => e.slug === channel.slug))
                        : undefined;
                    const typeLabel =
                      channel.type === "official" ? "Oficial" : "Comunidad";
                    const access =
                      label.badge && label.badge !== typeLabel
                        ? label.badge
                        : undefined;
                    return (
                      <HubRow
                        key={channel.id}
                        tone="quiet"
                        glyph={channel.type === "official" ? "🏛" : "📣"}
                        title={channel.name}
                        meta={[typeLabel, access].filter(Boolean).join(" · ")}
                        onClick={
                          matchedEntity
                            ? () =>
                                router.push(`/official/${matchedEntity.slug}`)
                            : undefined
                        }
                      />
                    );
                  })
                : null}
            </div>
          )}
        </HomeSection>
      </section>

      {/*
        Explorar anchor (gated).
        Not a Belong peer. Destinations remain on Operate/Life routes;
        this portal is hidden until explorePortalReady. Section id kept
        for ?tab=espacios|mascotas scroll compatibility.
      */}
      <section id="plaza-explore" className="scroll-mt-3">
        {showExplore ? (
          <HomeSection
            title="Explorar"
            subtitle={`Todo lo que vive en ${communityName}.`}
          >
            <HubTileGrid>
              {showExperiences ? (
                <HubTile
                  label="Experiencias"
                  glyph="✨"
                  meta={plural(experienceCount, "plan", "planes")}
                  tint="bg-[var(--color-action-accent-subtle)]"
                  onSelect={() => router.push("/experiences")}
                />
              ) : null}
              {showSpaces ? (
                <HubTile
                  label="Espacios"
                  glyph="🏊"
                  meta={plural(espacios.length, "espacio", "espacios")}
                  tint="bg-[var(--color-sea-subtle)]"
                  onSelect={() => router.push("/resources")}
                />
              ) : null}
              {showServices ? (
                <HubTile
                  label="Servicios"
                  glyph="🛠"
                  meta="Vecinos y negocios"
                  tint="bg-[var(--color-sea-subtle)]"
                  onSelect={() => router.push("/services")}
                />
              ) : null}
              {showPets ? (
                <HubTile
                  label="Mascotas"
                  glyph="🐾"
                  meta={plural(mascotasItems.length, "recurso", "recursos")}
                  tint="bg-[var(--color-feedback-success-subtle)]"
                  active={petsOpen}
                  expandable
                  onSelect={() => setPetsOpen((v) => !v)}
                />
              ) : null}
            </HubTileGrid>

            {showPets && petsOpen ? (
              <HubPanel
                title="Mascotas"
                description="Lugares, manos y grupos para tu mascota."
                onClose={() => setPetsOpen(false)}
                className="mt-3"
              >
                {mascotasItems.map((item) => {
                  if (item.kind === "place") {
                    return (
                      <HubRow
                        key={`place-${item.place.id}`}
                        glyph="🐾"
                        title={item.place.name}
                        meta={item.place.story}
                        onClick={() =>
                          router.push(
                            resolvePlaceHref({
                              entityOrLocationId: item.place.id,
                              tenantId,
                            }),
                          )
                        }
                      />
                    );
                  }
                  if (item.kind === "work") {
                    return (
                      <HubRow
                        key={`work-${item.post.id}`}
                        glyph="🤝"
                        title={item.post.title}
                        meta="Colaboración entre vecinos"
                        onClick={() =>
                          router.push(
                            helpHrefForCategory(
                              item.post.id,
                              item.post.category,
                            ),
                          )
                        }
                      />
                    );
                  }
                  return (
                    <HubRow
                      key={`group-${item.group.id}`}
                      imageUrl={item.group.imageUrl}
                      glyph="🐾"
                      title={item.group.name}
                      meta={plural(
                        item.group.memberCount,
                        "miembro",
                        "miembros",
                      )}
                      onClick={() =>
                        router.push(
                          `/community/groups/${item.group.id}/conversation`,
                        )
                      }
                    />
                  );
                })}
              </HubPanel>
            ) : null}
          </HomeSection>
        ) : (
          <span className="sr-only">
            Explorar está fuera de Comunidad Belong. Usa Servicios o Planes.
          </span>
        )}
      </section>
      <LifePlaceHost
        tenantId={tenantId}
        locationId={placeLocationId}
        territoryId={activeTerritory.territoryId}
        onClose={() => setPlaceLocationId(null)}
      />
    </MobileScreen>
  );
}

/** @deprecated Use CommunityHubScreen — kept for existing imports. */
export const CommunityScreen = CommunityHubScreen;
