"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  communityAlertIcon,
  communityAlertTone,
  formatContentWhen,
  listAccessibleChannels,
  listActiveCommunityAlerts,
  listActualidadContent,
  listDiscoverableExperiences,
  listEspaciosComunitarios,
  listGroups,
  listMascotasHubItems,
  listOfficialContent,
  listOfficialEntities,
  listParticipacionContent,
  resolveCommunityHubArea,
  type CommunityHubAreaId,
} from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
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
import { channelAccessLabel } from "@/lib/demo-access-copy";

/** Explorable areas that open in place instead of a separate route. */
type HubAreaKey =
  | "actualidad"
  | "canales"
  | "espacios"
  | "mascotas"
  | "oficial";

const NEIGHBOUR_PEEK = 3;

function proposalStatus(status?: string): HubProposalStatus {
  if (status === "closing_soon") return "closing_soon";
  if (status === "closed") return "closed";
  return "open";
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Community Hub — digital town square.
 * Three intents, in order: what needs attention → who is talking →
 * what you can explore. Areas open in place so ?tab= deep links keep working
 * without a parallel route per area.
 */
export function CommunityHubScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, isModuleEnabled, hasCapability, demoPersonId } =
    useTenant();
  const { feedItems, getContent } = useCommunityInteractions();

  const [expandGroups, setExpandGroups] = useState(false);
  const [expandNeighbours, setExpandNeighbours] = useState(false);
  const [activeArea, setActiveArea] = useState<HubAreaKey | null>(null);

  const canView = hasCapability(CAPABILITIES.contentView);
  const canChannels = hasCapability(CAPABILITIES.channelView);
  const canCreate =
    isFeatureEnabled("feed") && hasCapability(CAPABILITIES.contentCreate);

  const communityOn = isModuleEnabled("community");

  const feedById = useMemo(
    () => new Map(feedItems.map((item) => [item.id, item])),
    [feedItems],
  );

  const alerts = useMemo(() => listActiveCommunityAlerts(), []);

  const officialNotices = useMemo(() => {
    return listOfficialContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean)
      .slice(0, 3) as typeof feedItems;
  }, [feedById]);

  const neighbourActivity = useMemo(() => {
    return feedItems
      .filter((c) => !c.isOfficial && c.type !== "proposal")
      .slice(0, 8);
  }, [feedItems]);

  const participation = useMemo(() => {
    return listParticipacionContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const groupItems = useMemo(() => listGroups(), []);
  const accessibleChannels = useMemo(
    () => listAccessibleChannels(demoPersonId),
    [demoPersonId],
  );
  const espacios = useMemo(() => listEspaciosComunitarios(), []);
  const officialEntities = useMemo(() => listOfficialEntities(), []);
  const actualidad = useMemo(() => listActualidadContent(), []);
  const experienceCount = useMemo(
    () => listDiscoverableExperiences({ includeSessionCreated: false }).length,
    [],
  );
  const mascotasItems = useMemo(() => {
    try {
      return listMascotasHubItems();
    } catch {
      return [];
    }
  }, []);

  const tabParam = searchParams.get("tab");
  const resolvedTab = resolveCommunityHubArea(tabParam);

  useEffect(() => {
    // Deep links (?tab=) jump to a section. Plain /community stays at top.
    if (!tabParam || !resolvedTab) {
      const t = window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 0);
      return () => window.clearTimeout(t);
    }

    const sectionByTab: Record<CommunityHubAreaId, string> = {
      actualidad: "plaza-important",
      grupos: "plaza-people",
      conversaciones: "plaza-activity",
      propuestas: "plaza-participate",
      participacion: "plaza-participate",
      canales: "plaza-explore",
      espacios: "plaza-explore",
      mascotas: "plaza-explore",
    };

    if (resolvedTab === "grupos") setExpandGroups(true);
    if (resolvedTab === "conversaciones") setExpandNeighbours(true);
    if (resolvedTab === "canales") setActiveArea("canales");
    if (resolvedTab === "espacios") setActiveArea("espacios");
    if (resolvedTab === "mascotas") setActiveArea("mascotas");

    const id = sectionByTab[resolvedTab];
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
        title="La comunidad está tranquila"
        description="Aún no hay funciones de participación activadas."
      />
    );
  }

  if (!canView) {
    return (
      <EmptyState
        title="Sin acceso"
        description="El contenido de la comunidad no está disponible para tu cuenta."
      />
    );
  }

  const openPostComposer = () =>
    window.dispatchEvent(new Event("lcos:open-post"));

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
  const showActualidad = isFeatureEnabled("feed") && actualidad.length > 0;
  const showOfficial = officialEntities.length > 0;

  const toggleArea = (key: HubAreaKey) =>
    setActiveArea((current) => (current === key ? null : key));

  const livingLine =
    [
      participation.length > 0
        ? plural(participation.length, "propuesta abierta", "propuestas abiertas")
        : null,
      groupItems.length > 0 ? plural(groupItems.length, "grupo", "grupos") : null,
      neighbourActivity.length > 0
        ? plural(neighbourActivity.length, "tema entre vecinos", "temas entre vecinos")
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Qué pasa hoy con tus vecinos.";

  const visibleNeighbours = expandNeighbours
    ? neighbourActivity
    : neighbourActivity.slice(0, NEIGHBOUR_PEEK);

  const attentionCount = alerts.length + officialNotices.length;

  return (
    <MobileScreen dense>
      <header className="pt-0.5">
        <h1 className="font-sans text-[26px] font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
          Comunidad
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-tertiary)]">
          {livingLine}
        </p>
        {canCreate ? (
          <Button
            variant="secondary"
            onClick={openPostComposer}
            className="mt-3 min-h-[44px] w-full text-[15px]"
          >
            Escribir en la comunidad
          </Button>
        ) : null}
      </header>

      {attentionCount > 0 ? (
        <section id="plaza-important" className="scroll-mt-3">
          <span id="plaza-avisos" className="sr-only" />
          <HomeSection
            title="Requiere tu atención"
            subtitle="Avisos activos y comunicados oficiales."
          >
            <div className="space-y-2.5">
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
                            if (alert.href?.includes("#plaza-avisos")) {
                              document
                                .getElementById("plaza-important")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              return;
                            }
                            router.push(alert.href!);
                          }
                        : undefined
                    }
                  />
                );
              })}

              {officialNotices.map((item) => (
                <HubRow
                  key={item.id}
                  glyph="📢"
                  title={item.title}
                  meta={item.author.name}
                  trailingLabel={formatContentWhen(
                    item.publishedAt ?? item.createdAt,
                  )}
                  onClick={() => router.push(`/community/content/${item.id}`)}
                />
              ))}
            </div>
          </HomeSection>
        </section>
      ) : (
        <div id="plaza-important" className="scroll-mt-3" />
      )}

      {groupItems.length > 0 ? (
        <section id="plaza-people" className="scroll-mt-3">
          <HomeSection
            title="Grupos"
            subtitle="Vecinos organizados por afición."
            actionLabel={expandGroups ? "Ver menos" : "Ver todos"}
            onAction={() => setExpandGroups((v) => !v)}
          >
            {expandGroups ? (
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
      ) : null}

      <section id="plaza-activity" className="scroll-mt-3">
        <HomeSection
          title="Entre vecinos"
          subtitle="Conversaciones abiertas hoy."
          actionLabel={
            neighbourActivity.length > NEIGHBOUR_PEEK
              ? expandNeighbours
                ? "Ver menos"
                : "Ver todas"
              : undefined
          }
          onAction={
            neighbourActivity.length > NEIGHBOUR_PEEK
              ? () => setExpandNeighbours((v) => !v)
              : undefined
          }
        >
          {neighbourActivity.length === 0 ? (
            <EmptyState
              title="Sé el primero en compartir"
              description="Cuenta algo útil a tus vecinos: un aviso, una pregunta o una mano."
              actionLabel={canCreate ? "Escribir en la comunidad" : undefined}
              onAction={canCreate ? openPostComposer : undefined}
            />
          ) : (
            <div className="space-y-2.5">
              {visibleNeighbours.map((item) => {
                const live = getContent(item.id) ?? item;
                const zone =
                  live.areaLabel && live.areaLabel !== "Life Panoramica"
                    ? live.areaLabel
                    : undefined;
                return (
                  <HubDoorCard
                    key={live.id}
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
                    onClick={() =>
                      router.push(
                        `/community/neighbours/${encodeURIComponent(live.author.id)}/conversation`,
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </HomeSection>
      </section>

      <section id="plaza-participate" className="scroll-mt-3">
        <HomeSection
          title="Propuestas"
          subtitle="Decisiones abiertas de la comunidad."
        >
          {participation.length === 0 ? (
            <EmptyState
              title="Sin decisiones abiertas"
              description="Cuando la comunidad pida opinión, la verás aquí."
            />
          ) : (
            <div className="space-y-2.5">
              {participation.map((item) => {
                const live = getContent(item.id) ?? item;
                const zone =
                  live.areaLabel && live.areaLabel !== "Life Panoramica"
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

      <section id="plaza-explore" className="scroll-mt-3">
        <HomeSection
          title="Explora la comunidad"
          subtitle="Todo lo que vive en Panorámica."
        >
          <HubTileGrid>
            {showActualidad ? (
              <HubTile
                label="Actualidad"
                glyph="📰"
                meta={plural(actualidad.length, "noticia", "noticias")}
                tint="bg-[var(--color-sea-subtle)]"
                active={activeArea === "actualidad"}
                onSelect={() => toggleArea("actualidad")}
              />
            ) : null}
            {showChannels ? (
              <HubTile
                label="Canales"
                glyph="📣"
                meta={plural(accessibleChannels.length, "canal", "canales")}
                tint="bg-[var(--color-action-accent-subtle)]"
                active={activeArea === "canales"}
                onSelect={() => toggleArea("canales")}
              />
            ) : null}
            {showSpaces ? (
              <HubTile
                label="Espacios"
                glyph="🏊"
                meta={plural(espacios.length, "espacio", "espacios")}
                tint="bg-[var(--color-sea-subtle)]"
                active={activeArea === "espacios"}
                onSelect={() => toggleArea("espacios")}
              />
            ) : null}
            {showExperiences ? (
              <HubTile
                label="Experiencias"
                glyph="✨"
                meta={plural(experienceCount, "plan", "planes")}
                tint="bg-[var(--color-action-accent-subtle)]"
                onSelect={() => router.push("/experiences")}
              />
            ) : null}
            {showOfficial ? (
              <HubTile
                label="Oficial"
                glyph="🏛"
                meta={plural(officialEntities.length, "entidad", "entidades")}
                active={activeArea === "oficial"}
                onSelect={() => toggleArea("oficial")}
              />
            ) : null}
            {showPets ? (
              <HubTile
                label="Mascotas"
                glyph="🐾"
                meta={plural(mascotasItems.length, "recurso", "recursos")}
                tint="bg-[var(--color-feedback-success-subtle)]"
                active={activeArea === "mascotas"}
                onSelect={() => toggleArea("mascotas")}
              />
            ) : null}
          </HubTileGrid>

          {activeArea === "actualidad" ? (
            <HubPanel
              title="Actualidad"
              description="Lo que está pasando ahora en la comunidad."
              onClose={() => setActiveArea(null)}
              className="mt-3"
            >
              {actualidad.slice(0, 6).map((item) => (
                <HubRow
                  key={item.id}
                  glyph="📰"
                  title={item.title}
                  meta={item.author.name}
                  trailingLabel={formatContentWhen(
                    item.publishedAt ?? item.createdAt,
                  )}
                  onClick={() => router.push(`/community/content/${item.id}`)}
                />
              ))}
            </HubPanel>
          ) : null}

          {activeArea === "canales" ? (
            <HubPanel
              title="Canales"
              description="Comunicación oficial y de vecinos."
              onClose={() => setActiveArea(null)}
              className="mt-3"
            >
              {accessibleChannels.map((channel) => {
                const label = channelAccessLabel({
                  allowed: true,
                  reason: "accessible",
                  requiresVerifiedResidency:
                    channel.requiresVerifiedResidency,
                  type: channel.type,
                });
                const matchedEntity =
                  channel.type === "official"
                    ? officialEntities.find((e) => e.id === channel.ownerId) ??
                      officialEntities.find((e) => e.slug === channel.slug)
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
                    glyph={channel.type === "official" ? "🏛" : "📣"}
                    title={channel.name}
                    meta={[typeLabel, access].filter(Boolean).join(" · ")}
                    onClick={
                      matchedEntity
                        ? () => router.push(`/official/${matchedEntity.slug}`)
                        : undefined
                    }
                  />
                );
              })}
            </HubPanel>
          ) : null}

          {activeArea === "espacios" ? (
            <HubPanel
              title="Espacios compartidos"
              description="Zonas comunes de la comunidad."
              onClose={() => setActiveArea(null)}
              className="mt-3"
            >
              {espacios.map((space) => (
                <HubRow
                  key={space.id}
                  glyph="🏊"
                  title={space.name}
                  meta={[space.areaLabel, space.availabilityPreview]
                    .filter(Boolean)
                    .join(" · ")}
                  onClick={
                    space.bookable
                      ? () => router.push(`/resources/${space.id}`)
                      : undefined
                  }
                />
              ))}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => router.push("/resources")}
                className="mt-1 min-h-[44px] text-[15px]"
              >
                Ver todos los espacios
              </Button>
            </HubPanel>
          ) : null}

          {activeArea === "oficial" ? (
            <HubPanel
              title="Oficial"
              description="Entidades responsables de la comunidad."
              onClose={() => setActiveArea(null)}
              className="mt-3"
            >
              {officialEntities.map((entity) => (
                <HubRow
                  key={entity.id}
                  imageUrl={entity.imageUrl}
                  glyph="🏛"
                  title={entity.name}
                  meta={entity.description}
                  onClick={() => router.push(`/official/${entity.slug}`)}
                />
              ))}
            </HubPanel>
          ) : null}

          {activeArea === "mascotas" ? (
            <HubPanel
              title="Mascotas"
              description="Lugares, manos y grupos para tu mascota."
              onClose={() => setActiveArea(null)}
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
                        router.push(`/near/place/${item.place.id}`)
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
                      meta="Servicio entre vecinos"
                      onClick={() =>
                        router.push(`/services/work/${item.post.id}`)
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
      </section>
    </MobileScreen>
  );
}

/** @deprecated Use CommunityHubScreen — kept for existing imports. */
export const CommunityScreen = CommunityHubScreen;
