"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  communityAlertIcon,
  communityAlertTone,
  contentTypeLabel,
  formatContentWhen,
  getExperienceById,
  listAccessibleChannels,
  listActiveCommunityAlerts,
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
  CommunityFeed,
  CommunityPostCard,
  EmptyState,
  GroupCard,
  InlineCommentComposer,
  MobileScreen,
  ReactionBar,
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
    toggleReaction,
    addComment,
  } = useCommunityInteractions();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [commentHints, setCommentHints] = useState<Record<string, string>>({});
  const [composerForId, setComposerForId] = useState<string | null>(null);
  const [expandGroups, setExpandGroups] = useState(false);
  const [expandChannels, setExpandChannels] = useState(false);
  const [expandSpaces, setExpandSpaces] = useState(false);
  const [expandPets, setExpandPets] = useState(false);

  const canView = hasCapability(CAPABILITIES.contentView);
  const canReact = hasCapability(CAPABILITIES.interactionReact);
  const canComment = hasCapability(CAPABILITIES.interactionComment);
  const canChannels = hasCapability(CAPABILITIES.channelView);

  const communityOn = isModuleEnabled("community");

  const feedById = useMemo(() => {
    const map = new Map(feedItems.map((item) => [item.id, item]));
    return map;
  }, [feedItems]);

  const alerts = useMemo(() => listActiveCommunityAlerts(), []);

  const officialNotices = useMemo(() => {
    return listOfficialContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean)
      .slice(0, 2) as typeof feedItems;
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

  const submitComment = (id: string) => {
    const body = (drafts[id] ?? "").trim();
    if (body.length < 8) {
      setCommentHints((prev) => ({
        ...prev,
        [id]: "Escribe al menos unas palabras (8 caracteres).",
      }));
      return;
    }
    addComment(id, body);
    setDrafts((prev) => ({ ...prev, [id]: "" }));
    setCommentHints((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setComposerForId(null);
  };

  const renderPost = (
    item: (typeof feedItems)[number],
    tone?: CommunityPostTone,
  ) => {
    const linked = item.linkedExperienceId
      ? getExperienceById(item.linkedExperienceId)
      : undefined;
    const zone =
      item.areaLabel && item.areaLabel !== "Life Panoramica"
        ? item.areaLabel
        : undefined;

    return (
      <CommunityPostCard
        key={item.id}
        density="plaza"
        title={item.title}
        body={item.body}
        typeLabel={contentTypeLabel(item.type)}
        official={item.isOfficial}
        tone={tone ?? toneForItem(item)}
        authorName={item.author.name}
        authorAvatarUrl={item.author.avatarUrl}
        meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
        areaLabel={zone}
        decisionStatus={decisionLabel(item.decisionStatus)}
        experienceLinkLabel={linked?.title}
        onOpen={() => router.push(`/community/content/${item.id}`)}
        reactionBar={
          <ReactionBar
            variant="quiet"
            acknowledgeCount={item.reactionCounts.acknowledge}
            supportCount={item.reactionCounts.support}
            myReaction={getMyReaction(item.id)}
            commentCount={item.commentCount}
            canReact={canReact}
            canComment={canComment}
            canSave={false}
            onAcknowledge={() => toggleReaction(item.id, "acknowledge")}
            onSupport={() => toggleReaction(item.id, "support")}
            onComment={
              canComment
                ? () =>
                    setComposerForId((current) =>
                      current === item.id ? null : item.id,
                    )
                : undefined
            }
          />
        }
        commentComposer={
          canComment && composerForId === item.id ? (
            <div className="space-y-1">
              <InlineCommentComposer
                compact
                value={drafts[item.id] ?? ""}
                onChange={(value) => {
                  setDrafts((prev) => ({ ...prev, [item.id]: value }));
                  if (commentHints[item.id]) {
                    setCommentHints((prev) => {
                      const next = { ...prev };
                      delete next[item.id];
                      return next;
                    });
                  }
                }}
                onSubmit={() => submitComment(item.id)}
              />
              {commentHints[item.id] ? (
                <p
                  className="text-[12px] font-medium text-[var(--color-feedback-danger)]"
                  role="alert"
                >
                  {commentHints[item.id]}
                </p>
              ) : null}
            </div>
          ) : null
        }
      />
    );
  };

  const visibleGroups = expandGroups ? groupItems : groupItems.slice(0, 4);
  const showChannels =
    isFeatureEnabled("communityChannels") ||
    isFeatureEnabled("officialChannels");
  const showSpaces =
    isModuleEnabled("reservations") || isModuleEnabled("community");
  /** Keep section mountable for ?tab=mascotas even if module flag drifts. */
  const showPets =
    isModuleEnabled("community.pets") || resolvedTab === "mascotas";

  return (
    <MobileScreen dense>
      <header className="pt-0.5">
        <h1 className="font-sans text-[24px] font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
          Comunidad
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
          Qué pasa hoy con tus vecinos.
        </p>
        {isFeatureEnabled("feed") &&
        hasCapability(CAPABILITIES.contentCreate) ? (
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("lcos:open-post"))
            }
            className="mt-2 text-[14px] font-semibold text-[var(--color-action-primary)]"
          >
            Escribir en la comunidad
          </button>
        ) : null}
      </header>

      {alerts.length > 0 ? (
        <section id="plaza-important" className="scroll-mt-3 space-y-1">
          {alerts.map((alert) => {
            const tone = communityAlertTone(alert.level);
            const shell =
              tone === "alert"
                ? "border-[var(--color-feedback-danger)]"
                : tone === "important"
                  ? "border-[var(--color-feedback-warning)]"
                  : "border-[var(--color-feedback-info)]";
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() =>
                  router.push(alert.href ?? "/community#plaza-activity")
                }
                className={`flex w-full items-baseline gap-2 border-l-[3px] py-1.5 pl-2.5 text-left ${shell}`}
              >
                <span className="text-[14px]" aria-hidden>
                  {communityAlertIcon(alert.kind, alert.level)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {alert.title}
                  <span className="font-normal text-[var(--color-text-tertiary)]">
                    {" "}
                    · {alert.contextLabel}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ) : (
        <div id="plaza-important" className="scroll-mt-3" />
      )}

      {officialNotices.length > 0 ? (
        <section className="border-b border-[var(--color-border-subtle)] pb-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Avisos
          </p>
          <ul>
            {officialNotices.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/community/content/${item.id}`)
                  }
                  className="flex w-full items-center justify-between gap-2 py-1.5 text-left"
                >
                  <span className="min-w-0 truncate text-[14px] font-medium text-[var(--color-text-primary)]">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[12px] text-[var(--color-text-tertiary)]">
                    {formatContentWhen(item.publishedAt ?? item.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="plaza-activity" className="scroll-mt-3">
        <SectionHeader title="Entre vecinos" />
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

      <section id="plaza-participate" className="scroll-mt-3">
        <SectionHeader title="Puedes aportar" />
        <CommunityFeed
          empty={
            <p className="py-2 text-[13px] text-[var(--color-text-secondary)]">
              Cuando haya decisiones abiertas, las verás aquí.
            </p>
          }
        >
          {participation.map((item) => renderPost(item, "proposal"))}
        </CommunityFeed>
      </section>

      <section id="plaza-people" className="scroll-mt-3 space-y-2">
        <SectionHeader
          title="Grupos"
          action={
            groupItems.length > 4 ? (
              <button
                type="button"
                className="text-[13px] font-semibold text-[var(--color-action-primary)]"
                onClick={() => setExpandGroups((v) => !v)}
              >
                {expandGroups ? "Ver menos" : "Ver todos →"}
              </button>
            ) : null
          }
        />

        {groupItems.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Los grupos de vecinos aparecerán aquí.
          </p>
        ) : (
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleGroups.map((group) => (
              <div key={group.id} className="w-[112px] shrink-0">
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
                : channel.type === "official"
                  ? undefined
                  : `/community?tab=grupos`;
              return (
                <article
                  key={channel.id}
                  className="rounded-[14px] border-b border-[var(--color-border-subtle)] px-1 py-3 last:border-b-0"
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
                          onClick={() =>
                            router.push(`/near/place/${item.place.id}`)
                          }
                        >
                          Ver lugar →
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
