"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  communityAlertIcon,
  communityAlertTone,
  contentTypeLabel,
  formatContentWhen,
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
  CommentPreview,
  CommunityConversationList,
  CommunityConversationRow,
  EmptyState,
  InlineCommentComposer,
  MobileScreen,
  ReactionBar,
  SectionHeader,
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
    getContent,
    getMyReaction,
    toggleReaction,
    addComment,
  } = useCommunityInteractions();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [commentHints, setCommentHints] = useState<Record<string, string>>({});
  const [openConversationId, setOpenConversationId] = useState<string | null>(
    null,
  );
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
    if (!body) {
      setCommentHints((prev) => ({
        ...prev,
        [id]: "Escribe al menos una letra.",
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
  };

  const renderConversation = (
    item: (typeof feedItems)[number],
    options?: { typeLabel?: string },
  ) => {
    const live = getContent(item.id) ?? item;
    const zone =
      live.areaLabel && live.areaLabel !== "Life Panoramica"
        ? live.areaLabel
        : undefined;
    const status = decisionLabel(live.decisionStatus);
    const meta = [
      live.author.name,
      formatContentWhen(live.publishedAt ?? live.createdAt),
      zone,
      status,
    ]
      .filter(Boolean)
      .join(" · ");
    const open = openConversationId === live.id;
    const comments = live.comments.filter((c) => c.body.trim().length > 0);

    return (
      <CommunityConversationRow
        key={live.id}
        title={live.title}
        body={live.body}
        meta={meta}
        official={live.isOfficial}
        typeLabel={
          options?.typeLabel ??
          (live.type === "proposal" ? contentTypeLabel(live.type) : undefined)
        }
        open={open}
        onToggle={() =>
          setOpenConversationId((current) =>
            current === live.id ? null : live.id,
          )
        }
        onOpen={() => router.push(`/community/content/${live.id}`)}
        reactionBar={
          <ReactionBar
            variant="quiet"
            acknowledgeCount={live.reactionCounts.acknowledge}
            supportCount={live.reactionCounts.support}
            myReaction={getMyReaction(live.id)}
            commentCount={live.commentCount}
            canReact={canReact}
            canComment={false}
            canSave={false}
            onAcknowledge={() => toggleReaction(live.id, "acknowledge")}
            onSupport={() => toggleReaction(live.id, "support")}
          />
        }
        conversation={
          <div className="space-y-2 p-3">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Comentarios
              {comments.length > 0 ? ` · ${comments.length}` : ""}
            </p>
            <div className="max-h-[220px] space-y-2.5 overflow-y-auto overscroll-contain pr-1">
              {comments.length === 0 ? (
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  Sé el primero en responder.
                </p>
              ) : (
                comments.map((c) => (
                  <CommentPreview
                    key={c.id}
                    authorName={c.author.name}
                    body={c.body}
                    avatarUrl={c.author.avatarUrl}
                    meta={formatContentWhen(c.createdAt)}
                  />
                ))
              )}
            </div>
            {canComment ? (
              <div className="space-y-1 border-t border-[var(--color-border-subtle)] pt-2">
                <InlineCommentComposer
                  compact
                  value={drafts[live.id] ?? ""}
                  onChange={(value) => {
                    setDrafts((prev) => ({ ...prev, [live.id]: value }));
                    if (commentHints[live.id]) {
                      setCommentHints((prev) => {
                        const next = { ...prev };
                        delete next[live.id];
                        return next;
                      });
                    }
                  }}
                  onSubmit={() => submitComment(live.id)}
                />
                {commentHints[live.id] ? (
                  <p
                    className="text-[12px] font-medium text-[var(--color-feedback-danger)]"
                    role="alert"
                  >
                    {commentHints[live.id]}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        }
      />
    );
  };

  const renderGroupDoor = (group: (typeof groupItems)[number]) => (
    <button
      key={group.id}
      type="button"
      onClick={() => router.push(`/community/groups/${group.id}`)}
      className="flex w-full min-h-[52px] items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] px-4 py-3 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
          {group.name}
        </span>
        <span className="mt-0.5 block text-[13px] text-[var(--color-text-tertiary)]">
          {group.memberCount} miembros
          {group.categoryLabel ? ` · ${group.categoryLabel}` : ""}
        </span>
      </span>
      <span
        className="shrink-0 text-[18px] text-[var(--color-action-primary)]"
        aria-hidden
      >
        ›
      </span>
    </button>
  );

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
        <section id="plaza-important" className="scroll-mt-3 space-y-2">
          {alerts.map((alert) => {
            const tone = communityAlertTone(alert.level);
            const shell =
              tone === "alert"
                ? "border-[color-mix(in_srgb,#B42318_42%,transparent)] bg-[#F8E8E6]"
                : tone === "important"
                  ? "border-[color-mix(in_srgb,#B8860B_45%,transparent)] bg-[#FBF3DC]"
                  : "border-[color-mix(in_srgb,#3D6B7A_40%,transparent)] bg-[#E8F1F4]";
            const area =
              alert.areaLabel ??
              alert.contextLabel.split("·").slice(1).join("·").trim();
            const windowLabel =
              alert.timeWindowLabel ??
              alert.contextLabel.split("·")[0]?.trim();
            const action =
              alert.actionLabel ??
              (alert.href ? "Ver detalle" : undefined);
            return (
              <button
                key={alert.id}
                type="button"
                onClick={() => {
                  if (!alert.href) return;
                  if (alert.href.includes("#plaza-avisos")) {
                    document
                      .getElementById("plaza-avisos")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    return;
                  }
                  router.push(alert.href);
                }}
                className={`flex w-full items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left ${shell}`}
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-[22px] leading-none"
                  aria-hidden
                >
                  {communityAlertIcon(alert.kind, alert.level)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
                    {alert.title}
                  </span>
                  {(area || windowLabel) ? (
                    <span className="mt-1 block text-[13px] leading-5 text-[var(--color-text-secondary)]">
                      {[area ? `Zona · ${area.replace(/^Zona\s+/i, "")}` : null, windowLabel]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : (
                    <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">
                      {alert.contextLabel}
                    </span>
                  )}
                  {action ? (
                    <span className="mt-2 inline-flex text-[14px] font-semibold text-[var(--color-action-primary)]">
                      {action} →
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </section>
      ) : (
        <div id="plaza-important" className="scroll-mt-3" />
      )}

      {officialNotices.length > 0 ? (
        <section
          id="plaza-avisos"
          className="scroll-mt-3 border-b border-[var(--color-border-subtle)] pb-2"
        >
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
      ) : (
        <div id="plaza-avisos" className="scroll-mt-3" />
      )}

      {groupItems.length > 0 ? (
        <section
          className="scroll-mt-3 space-y-2"
          aria-label="Grupos activos"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              Grupos activos
            </p>
            <button
              type="button"
              className="text-[13px] font-semibold text-[var(--color-action-primary)]"
              onClick={() => {
                setExpandGroups(true);
                document.getElementById("plaza-people")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2">
            {groupItems.slice(0, 3).map((group) => renderGroupDoor(group))}
          </div>
        </section>
      ) : null}

      <section id="plaza-activity" className="scroll-mt-3">
        <SectionHeader title="Entre vecinos" />
        <CommunityConversationList
          empty={
            <EmptyState
              title="Sé el primero en compartir"
              description="Cuenta algo útil a tus vecinos: un aviso, una pregunta o una mano."
              actionLabel={
                isFeatureEnabled("feed") &&
                hasCapability(CAPABILITIES.contentCreate)
                  ? "Escribir en la comunidad"
                  : undefined
              }
              onAction={
                isFeatureEnabled("feed") &&
                hasCapability(CAPABILITIES.contentCreate)
                  ? () =>
                      window.dispatchEvent(new Event("lcos:open-post"))
                  : undefined
              }
            />
          }
        >
          {neighbourActivity.map((item) => renderConversation(item))}
        </CommunityConversationList>
      </section>

      <section id="plaza-participate" className="scroll-mt-3">
        <SectionHeader title="Puedes aportar" />
        <CommunityConversationList
          empty={
            <p className="py-2 text-[14px] leading-5 text-[var(--color-text-secondary)]">
              Todavía no hay decisiones abiertas. Cuando la comunidad
              pida opinión, podrás leer y comentar aquí.
            </p>
          }
        >
          {participation.map((item) =>
            renderConversation(item, {
              typeLabel: contentTypeLabel(item.type),
            }),
          )}
        </CommunityConversationList>
        {participation.length > 0 ? (
          <p className="mt-2 text-[12px] leading-4 text-[var(--color-text-tertiary)]">
            Despliega una propuesta para leer y comentar. La votación
            formal aún no está disponible.
          </p>
        ) : null}
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
          <p className="text-[14px] leading-5 text-[var(--color-text-secondary)]">
            Únete a vecinos cuando aparezcan grupos aquí. Formar parte de
            un grupo es la mejor forma de compartir la vida de la
            comunidad.
          </p>
        ) : (
          <div className="space-y-2">
            {visibleGroups.map((group) => renderGroupDoor(group))}
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
                : undefined;
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
                    ) : (
                      <span className="text-[13px] text-[var(--color-text-tertiary)]">
                        {channel.type === "official"
                          ? "Canal oficial · sin destino vinculado"
                          : "Canal de vecinos · sin pantalla propia todavía"}
                      </span>
                    )}
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
            <div className="space-y-2">
              <p className="text-[14px] leading-5 text-[var(--color-text-secondary)]">
                Todavía no hay nada de mascotas. Comparte un lugar, un
                aviso o una mano entre vecinos cuando quieras.
              </p>
              {isFeatureEnabled("feed") &&
              hasCapability(CAPABILITIES.contentCreate) ? (
                <button
                  type="button"
                  className="text-[14px] font-semibold text-[var(--color-action-primary)]"
                  onClick={() =>
                    window.dispatchEvent(new Event("lcos:open-post"))
                  }
                >
                  Escribir en la comunidad
                </button>
              ) : null}
            </div>
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
