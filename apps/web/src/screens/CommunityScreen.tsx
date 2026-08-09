"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  communityAlertIcon,
  communityAlertLevelLabel,
  communityAlertTone,
  contentTypeLabel,
  formatContentWhen,
  getExperienceById,
  listAccessibleChannels,
  listActiveCommunityAlerts,
  listCommunityDiscussionContent,
  listEspaciosComunitarios,
  listGroups,
  listMascotasHubItems,
  listOfficialContent,
  listOfficialEntities,
  listParticipacionContent,
  listPublishedCommunityContent,
  resolveCommunityHubArea,
  type CommunityHubAreaId,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommentPreview,
  CommunityFeed,
  CommunityPostCard,
  EmptyState,
  GroupCard,
  InlineCommentComposer,
  MobileScreen,
  ReactionBar,
  ScreenHeader,
  SectionHeader,
  type CommunityPostTone,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { channelAccessLabel } from "@/lib/demo-access-copy";

type PlazaSectionId =
  | "important"
  | "activity"
  | "participate"
  | "people"
  | "canales"
  | "espacios"
  | "mascotas";

function tabToSection(tab: CommunityHubAreaId | null): PlazaSectionId {
  switch (tab) {
    case "actualidad":
      return "important";
    case "propuestas":
    case "participacion":
      return "participate";
    case "grupos":
    case "conversaciones":
      return "people";
    case "canales":
      return "canales";
    case "espacios":
      return "espacios";
    case "mascotas":
      return "mascotas";
    default:
      return "important";
  }
}

function decisionLabel(status?: string) {
  if (status === "closing_soon") return "Cierra pronto";
  if (status === "closed") return "Cerrada";
  if (status === "open") return "Abierta";
  return undefined;
}

function toneForItem(item: {
  isOfficial: boolean;
  type: string;
}): CommunityPostTone {
  if (item.isOfficial) return "official";
  if (item.type === "proposal") return "proposal";
  if (item.type === "discussion") return "discussion";
  return "neighbour";
}

/**
 * Community Hub — digital town square.
 * One living plaza: important → neighbour activity → participate → people.
 * Deep links (?tab=) scroll to sections — not a module tab bar.
 */
export function CommunityHubScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFeatureEnabled, isModuleEnabled, hasCapability, demoPersonId } =
    useTenant();
  const {
    feedItems,
    getMyReaction,
    isSaved,
    isReported,
    toggleReaction,
    toggleSave,
    reportContent,
    addComment,
  } = useCommunityInteractions();

  const [composerForId, setComposerForId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expandGroups, setExpandGroups] = useState(false);
  const [expandChannels, setExpandChannels] = useState(false);
  const [expandSpaces, setExpandSpaces] = useState(false);
  const [expandPets, setExpandPets] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const canView = hasCapability(CAPABILITIES.contentView);
  const canReact = hasCapability(CAPABILITIES.interactionReact);
  const canComment = hasCapability(CAPABILITIES.interactionComment);
  const canSave = hasCapability(CAPABILITIES.interactionSave);
  const canReport = hasCapability(CAPABILITIES.interactionReport);
  const canChannels = hasCapability(CAPABILITIES.channelView);

  const communityOn = isModuleEnabled("community");

  const feedById = useMemo(() => {
    const map = new Map(feedItems.map((item) => [item.id, item]));
    return map;
  }, [feedItems]);

  const alerts = useMemo(() => listActiveCommunityAlerts(), []);

  const important = useMemo(() => {
    const officialIds = new Set(listOfficialContent().map((c) => c.id));
    const fromOfficial = listOfficialContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
    const announcements = listPublishedCommunityContent()
      .filter((c) => c.type === "announcement" && !officialIds.has(c.id))
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
    return [...fromOfficial, ...announcements].slice(0, 4);
  }, [feedById]);

  const neighbourActivity = useMemo(() => {
    const officialIds = new Set(important.map((i) => i.id));
    return feedItems
      .filter(
        (c) =>
          !c.isOfficial &&
          c.type !== "proposal" &&
          !officialIds.has(c.id),
      )
      .slice(0, 6);
  }, [feedItems, important]);

  const participation = useMemo(() => {
    return listParticipacionContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const discussions = useMemo(() => {
    return listCommunityDiscussionContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const groupItems = useMemo(() => listGroups(), []);
  const accessibleChannels = useMemo(
    () => listAccessibleChannels(demoPersonId),
    [demoPersonId],
  );
  const espacios = useMemo(() => listEspaciosComunitarios(), []);
  const mascotasItems = useMemo(() => listMascotasHubItems(), []);

  const tabParam = searchParams.get("tab");
  const resolvedTab = resolveCommunityHubArea(tabParam);

  useEffect(() => {
    const section = tabToSection(resolvedTab);
    if (section === "people" && resolvedTab === "grupos") {
      setExpandGroups(true);
    }
    if (section === "canales") setExpandChannels(true);
    if (section === "espacios") setExpandSpaces(true);
    if (section === "mascotas") setExpandPets(true);

    const id = `plaza-${section}`;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [resolvedTab, tabParam]);

  useEffect(() => {
    if (composerForId && composerRef.current) {
      composerRef.current.focus();
    }
  }, [composerForId]);

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

  const openComposer = (id: string) => {
    setComposerForId(id);
  };

  const submitComment = (id: string) => {
    const body = (drafts[id] ?? "").trim();
    if (body.length < 2) return;
    addComment(id, body);
    setDrafts((prev) => ({ ...prev, [id]: "" }));
  };

  const renderReactionBar = (item: (typeof feedItems)[number]) => (
    <ReactionBar
      acknowledgeCount={item.reactionCounts.acknowledge}
      supportCount={item.reactionCounts.support}
      myReaction={getMyReaction(item.id)}
      commentCount={item.commentCount}
      saved={isSaved(item.id)}
      reported={isReported(item.id)}
      canReact={canReact}
      canComment={canComment}
      canSave={canSave}
      commentActionLabel={
        item.commentCount > 0 ? `Comentar · ${item.commentCount}` : "Comentar"
      }
      onAcknowledge={() => toggleReaction(item.id, "acknowledge")}
      onSupport={() => toggleReaction(item.id, "support")}
      onComment={() => openComposer(item.id)}
      onSave={() => toggleSave(item.id)}
      onReport={canReport ? () => reportContent(item.id) : undefined}
    />
  );

  const renderComposer = (item: (typeof feedItems)[number]) => {
    if (!canComment) return null;
    if (composerForId !== item.id) return null;
    return (
      <InlineCommentComposer
        value={drafts[item.id] ?? ""}
        onChange={(value) =>
          setDrafts((prev) => ({ ...prev, [item.id]: value }))
        }
        onSubmit={() => submitComment(item.id)}
        inputRef={composerRef}
      />
    );
  };

  const renderPost = (
    item: (typeof feedItems)[number],
    tone?: CommunityPostTone,
  ) => {
    const linked = item.linkedExperienceId
      ? getExperienceById(item.linkedExperienceId)
      : undefined;
    const latest = item.comments[item.comments.length - 1];
    return (
      <CommunityPostCard
        key={item.id}
        title={item.title}
        body={item.body}
        typeLabel={contentTypeLabel(item.type)}
        official={item.isOfficial}
        tone={tone ?? toneForItem(item)}
        authorName={item.author.name}
        authorAvatarUrl={item.author.avatarUrl}
        meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
        areaLabel={item.areaLabel}
        imageUrl={item.imageUrl}
        decisionStatus={decisionLabel(item.decisionStatus)}
        experienceLinkLabel={linked?.title}
        onOpen={() => router.push(`/community/content/${item.id}`)}
        commentPreview={
          latest ? (
            <CommentPreview
              authorName={latest.author.name}
              body={latest.body}
              avatarUrl={latest.author.avatarUrl}
              meta={formatContentWhen(latest.createdAt)}
            />
          ) : null
        }
        reactionBar={renderReactionBar(item)}
        commentComposer={renderComposer(item)}
      />
    );
  };

  const visibleGroups = expandGroups ? groupItems : groupItems.slice(0, 4);
  const showChannels =
    isFeatureEnabled("communityChannels") ||
    isFeatureEnabled("officialChannels");
  const showSpaces =
    isModuleEnabled("reservations") || isModuleEnabled("community");
  const showPets = isModuleEnabled("community.pets");

  return (
    <MobileScreen>
      <ScreenHeader
        title="Comunidad"
        subtitle="Qué está pasando con tus vecinos hoy."
      />

      {/* 1 — Important */}
      <section id="plaza-important" className="scroll-mt-4 space-y-3">
        <SectionHeader title="Importante ahora" />
        {alerts.length > 0 ? (
          <ul className="space-y-2">
            {alerts.map((alert) => {
              const tone = communityAlertTone(alert.level);
              const shell =
                tone === "alert"
                  ? "border-[var(--color-feedback-danger)] bg-[var(--color-feedback-danger-subtle)]"
                  : tone === "important"
                    ? "border-[var(--color-feedback-warning)] bg-[var(--color-feedback-warning-subtle)]"
                    : "border-[var(--color-feedback-info)] bg-[var(--color-feedback-info-subtle)]";
              return (
                <li key={alert.id}>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(alert.href ?? "/community#plaza-important")
                    }
                    className={`flex w-full items-start gap-3 rounded-[16px] border-l-4 px-4 py-3.5 text-left shadow-[var(--shadow-elev-1)] ${shell}`}
                  >
                    <span className="text-[22px]" aria-hidden>
                      {communityAlertIcon(alert.kind, alert.level)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                        {communityAlertLevelLabel(alert.level)}
                      </span>
                      <span className="mt-0.5 block text-[16px] font-semibold text-[var(--color-text-primary)]">
                        {alert.title}
                      </span>
                      <span className="mt-1 block text-[14px] text-[var(--color-text-secondary)]">
                        {alert.contextLabel}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        <CommunityFeed
          empty={
            alerts.length === 0 ? (
              <p className="text-[15px] text-[var(--color-text-secondary)]">
                No hay avisos urgentes. La comunidad está en calma.
              </p>
            ) : null
          }
        >
          {important.map((item) => renderPost(item, "official"))}
        </CommunityFeed>
      </section>

      {/* 2 — Neighbour activity */}
      <section id="plaza-activity" className="scroll-mt-4 space-y-3">
        <SectionHeader title="Actividad de vecinos" />
        <CommunityFeed
          empty={
            <EmptyState
              title="Todavía está tranquilo"
              description="Cuando alguien comparta algo útil, aparecerá aquí."
            />
          }
        >
          {neighbourActivity.map((item) => renderPost(item))}
        </CommunityFeed>
      </section>

      {/* 3 — Participation */}
      <section id="plaza-participate" className="scroll-mt-4 space-y-3">
        <SectionHeader title="Tu participación" />
        <CommunityFeed
          empty={
            <p className="text-[15px] text-[var(--color-text-secondary)]">
              Cuando haya decisiones abiertas, las verás aquí.
            </p>
          }
        >
          {participation.map((item) => renderPost(item, "proposal"))}
        </CommunityFeed>
      </section>

      {/* 4 — Groups & conversations */}
      <section id="plaza-people" className="scroll-mt-4 space-y-4">
        <SectionHeader
          title="Grupos y conversaciones"
          action={
            groupItems.length > 4 ? (
              <button
                type="button"
                className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                onClick={() => setExpandGroups((v) => !v)}
              >
                {expandGroups ? "Ver menos" : "Ver todos →"}
              </button>
            ) : null
          }
        />

        {groupItems.length === 0 ? (
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            Los grupos de vecinos aparecerán aquí.
          </p>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleGroups.map((group) => (
              <div key={group.id} className="w-[148px] shrink-0">
                <GroupCard
                  name={group.name}
                  members={group.memberCount}
                  imageUrl={group.imageUrl}
                  onOpen={() => router.push(`/community/groups/${group.id}`)}
                />
              </div>
            ))}
          </div>
        )}

        <CommunityFeed
          empty={
            <p className="text-[15px] text-[var(--color-text-secondary)]">
              Las conversaciones de la comunidad aparecen aquí — no es un chat
              privado.
            </p>
          }
        >
          {discussions.map((item) => renderPost(item, "discussion"))}
        </CommunityFeed>
      </section>

      {/* Secondary peeks — reachable from hamburger deep links */}
      {showChannels && canChannels ? (
        <section id="plaza-canales" className="scroll-mt-4 space-y-3">
          <SectionHeader
            title="Canales"
            action={
              accessibleChannels.length > 2 ? (
                <button
                  type="button"
                  className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                  onClick={() => setExpandChannels((v) => !v)}
                >
                  {expandChannels ? "Ver menos" : "Ver todos →"}
                </button>
              ) : null
            }
          />
          <div className="space-y-2">
            {(expandChannels
              ? accessibleChannels
              : accessibleChannels.slice(0, 2)
            ).map((channel) => {
              const label = channelAccessLabel({
                allowed: true,
                reason: "accessible",
                requiresVerifiedResidency: channel.requiresVerifiedResidency,
                type: channel.type,
              });
              const officialEntities = listOfficialEntities();
              const matchedEntity =
                channel.type === "official"
                  ? officialEntities.find((e) => e.id === channel.ownerId) ??
                    officialEntities.find((e) => e.slug === channel.slug)
                  : undefined;
              const openHref = matchedEntity
                ? `/official/${matchedEntity.slug}`
                : undefined;
              return (
                <article
                  key={channel.id}
                  className="rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]"
                >
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    {channel.type === "official" ? "Oficial" : "Comunidad"}
                  </p>
                  <h3 className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                    {channel.name}
                  </h3>
                  {channel.description ? (
                    <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                      {channel.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-[14px] font-semibold text-[var(--color-action-primary)]">
                      {label.badge}
                    </span>
                    {openHref ? (
                      <button
                        type="button"
                        className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                        onClick={() => router.push(openHref)}
                      >
                        Abrir →
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {showSpaces ? (
        <section id="plaza-espacios" className="scroll-mt-4 space-y-3">
          <SectionHeader
            title="Espacios compartidos"
            action={
              <button
                type="button"
                className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                onClick={() => router.push("/resources")}
              >
                Ver todos →
              </button>
            }
          />
          <div className="space-y-2">
            {(expandSpaces ? espacios : espacios.slice(0, 2)).map((space) => (
              <article
                key={space.id}
                className="rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]"
              >
                <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                  {space.name}
                </h3>
                <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
                  {[space.areaLabel, space.availabilityPreview]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {space.bookable ? (
                  <button
                    type="button"
                    className="mt-2 min-h-[40px] text-[14px] font-semibold text-[var(--color-action-primary)]"
                    onClick={() => router.push(`/resources/${space.id}`)}
                  >
                    Ver espacio →
                  </button>
                ) : null}
              </article>
            ))}
            {espacios.length > 2 ? (
              <button
                type="button"
                className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                onClick={() => setExpandSpaces((v) => !v)}
              >
                {expandSpaces ? "Ver menos" : "Más espacios →"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {showPets ? (
        <section id="plaza-mascotas" className="scroll-mt-4 space-y-3">
          <SectionHeader
            title="Mascotas"
            action={
              mascotasItems.length > 2 ? (
                <button
                  type="button"
                  className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                  onClick={() => setExpandPets((v) => !v)}
                >
                  {expandPets ? "Ver menos" : "Ver todos →"}
                </button>
              ) : null
            }
          />
          {mascotasItems.length === 0 ? (
            <p className="text-[15px] text-[var(--color-text-secondary)]">
              Aquí vivirá lo relacionado con mascotas de la comunidad.
            </p>
          ) : (
            <div className="space-y-2">
              {(expandPets ? mascotasItems : mascotasItems.slice(0, 2)).map(
                (item) => {
                  if (item.kind === "place") {
                    return (
                      <article
                        key={`place-${item.place.id}`}
                        className="rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]"
                      >
                        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                          {item.place.name}
                        </h3>
                        <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
                          {item.place.story}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-[14px] font-semibold text-[var(--color-action-primary)]"
                          onClick={() => router.push("/near/services")}
                        >
                          Ver en Cerca →
                        </button>
                      </article>
                    );
                  }
                  if (item.kind === "work") {
                    return (
                      <article
                        key={`work-${item.post.id}`}
                        className="rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]"
                      >
                        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                          {item.post.title}
                        </h3>
                        <button
                          type="button"
                          className="mt-2 text-[14px] font-semibold text-[var(--color-action-primary)]"
                          onClick={() =>
                            router.push(`/services/work/${item.post.id}`)
                          }
                        >
                          Ver anuncio →
                        </button>
                      </article>
                    );
                  }
                  return (
                    <article
                      key={`group-${item.group.id}`}
                      className="rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-3.5 shadow-[var(--shadow-elev-1)]"
                    >
                      <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                        {item.group.name}
                      </h3>
                      <button
                        type="button"
                        className="mt-2 text-[14px] font-semibold text-[var(--color-action-primary)]"
                        onClick={() =>
                          router.push(`/community/groups/${item.group.id}`)
                        }
                      >
                        Abrir grupo →
                      </button>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      ) : null}
    </MobileScreen>
  );
}

/** @deprecated Use CommunityHubScreen — kept for existing imports. */
export const CommunityScreen = CommunityHubScreen;
