"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  communityHubHref,
  contentTypeLabel,
  formatContentWhen,
  getExperienceById,
  getTerritoryAccessContext,
  listAccessibleChannels,
  listActualidadContent,
  listCommunityDiscussionContent,
  listEspaciosComunitarios,
  listGroups,
  listMascotasHubItems,
  listParticipacionContent,
  listPropuestaContent,
  listVisibleCommunityHubAreas,
  resolveCommunityHubArea,
  type CommunityHubAreaId,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommunityConversationList,
  CommunityConversationRow,
  CommunityFeed,
  CommunityPostCard,
  EmptyState,
  FilterChipRow,
  GroupCard,
  MobileScreen,
  ReactionBar,
  ScreenHeader,
} from "@life-community-os/ui";
import { TerritoryBelongingCard } from "@/components/TerritoryBelongingCard";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { channelAccessLabel } from "@/lib/demo-access-copy";

/**
 * Community Hub (D.0.7.1.1) — belonging root for the territory.
 * Areas come from the canonical community-hub model (same as hamburger + registry).
 * Communication Layer conversations remain contextual (Group / Experience / Work / Official).
 */
export function CommunityHubScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    theme,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoPersonId,
  } = useTenant();
  const {
    feedItems,
    getMyReaction,
    isSaved,
    isReported,
    toggleReaction,
    toggleSave,
    reportContent,
  } = useCommunityInteractions();

  const territoryAccess = useMemo(
    () => getTerritoryAccessContext(demoPersonId),
    [demoPersonId],
  );

  const accessibleChannels = useMemo(
    () => listAccessibleChannels(demoPersonId),
    [demoPersonId],
  );

  const areas = useMemo(
    () =>
      listVisibleCommunityHubAreas({
        isModuleEnabled,
        isFeatureEnabled,
      }),
    [isModuleEnabled, isFeatureEnabled],
  );

  const chips = areas.map((a) => ({ id: a.id, label: a.label }));

  const tabParam = searchParams.get("tab");
  const initial = resolveCommunityHubArea(tabParam);
  const [area, setArea] = useState<CommunityHubAreaId>(
    initial && chips.some((c) => c.id === initial)
      ? initial
      : chips[0]?.id ?? "actualidad",
  );
  /** One open conversation row at a time — keeps the list compact. */
  const [openConversationId, setOpenConversationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const next = resolveCommunityHubArea(tabParam);
    if (next && chips.some((c) => c.id === next)) {
      setArea(next);
    }
    // chips length/ids only change with feature flags
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const active: CommunityHubAreaId | undefined = chips.some((c) => c.id === area)
    ? area
    : chips[0]?.id;

  const activeDefinition = areas.find((a) => a.id === active);

  const canView = hasCapability(CAPABILITIES.contentView);
  const canReact = hasCapability(CAPABILITIES.interactionReact);
  const canComment = hasCapability(CAPABILITIES.interactionComment);
  const canSave = hasCapability(CAPABILITIES.interactionSave);
  const canReport = hasCapability(CAPABILITIES.interactionReport);

  const feedById = useMemo(() => {
    const map = new Map(feedItems.map((item) => [item.id, item]));
    return map;
  }, [feedItems]);

  const actualidad = useMemo(() => {
    return listActualidadContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const discussions = useMemo(() => {
    return listCommunityDiscussionContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const proposals = useMemo(() => {
    return listPropuestaContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const participation = useMemo(() => {
    return listParticipacionContent()
      .map((c) => feedById.get(c.id))
      .filter(Boolean) as typeof feedItems;
  }, [feedById]);

  const groupItems = listGroups();
  const espacios = listEspaciosComunitarios();
  const mascotasItems = listMascotasHubItems();

  if (!active) {
    return (
      <EmptyState
        title="La comunidad está tranquila"
        description="Aún no hay funciones de participación activadas."
      />
    );
  }

  if (
    !canView &&
    (active === "actualidad" || active === "conversaciones")
  ) {
    return (
      <EmptyState
        title="Sin acceso"
        description="El contenido de la comunidad no está disponible para tu cuenta."
      />
    );
  }

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
      onAcknowledge={() => toggleReaction(item.id, "acknowledge")}
      onSupport={() => toggleReaction(item.id, "support")}
      onComment={() => router.push(`/community/content/${item.id}`)}
      onSave={() => toggleSave(item.id)}
      onReport={
        canReport
          ? () => {
              reportContent(item.id);
            }
          : undefined
      }
    />
  );

  const renderContentRows = (
    items: typeof feedItems,
    emptyTitle: string,
    emptyDescription: string,
  ) => (
    <CommunityConversationList
      empty={
        <EmptyState title={emptyTitle} description={emptyDescription} />
      }
    >
      {items.map((item) => {
        const linked = item.linkedExperienceId
          ? getExperienceById(item.linkedExperienceId)
          : undefined;
        const when = formatContentWhen(item.publishedAt ?? item.createdAt);
        const metaBits = [
          item.author.name,
          when,
          item.areaLabel,
          linked ? `Actividad · ${linked.title}` : null,
        ].filter(Boolean);
        return (
          <CommunityConversationRow
            key={item.id}
            title={item.title}
            body={item.body}
            typeLabel={contentTypeLabel(item.type)}
            official={item.isOfficial}
            meta={metaBits.join(" · ")}
            open={openConversationId === item.id}
            onToggle={() =>
              setOpenConversationId((current) =>
                current === item.id ? null : item.id,
              )
            }
            onOpen={() => router.push(`/community/content/${item.id}`)}
            reactionBar={renderReactionBar(item)}
          />
        );
      })}
    </CommunityConversationList>
  );

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Comunidad"
        subtitle="El lugar donde viven los vecinos del territorio."
      />

      <TerritoryBelongingCard access={territoryAccess} compact />

      <FilterChipRow
        items={chips}
        activeId={active}
        onChange={(id) => {
          const next = id as CommunityHubAreaId;
          setArea(next);
          router.replace(communityHubHref(next));
        }}
      />

      {activeDefinition ? (
        <p className="text-[13px] leading-5 text-[var(--color-text-secondary)]">
          {activeDefinition.purpose}
        </p>
      ) : null}

      {active === "actualidad"
        ? renderContentRows(
            actualidad,
            "Todavía no hay actualidad",
            "Cuando haya novedades del territorio, las verás aquí.",
          )
        : null}

      {active === "conversaciones"
        ? renderContentRows(
            discussions,
            "Todavía no hay conversaciones",
            "Las discusiones de la comunidad aparecen aquí — no es un chat privado.",
          )
        : null}

      {active === "grupos" ? (
        groupItems.length === 0 ? (
          <EmptyState
            title="Aún no hay grupos"
            description="Los grupos de vecinos aparecerán aquí."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {groupItems.map((group) => (
              <GroupCard
                key={group.id}
                name={group.name}
                members={group.memberCount}
                imageUrl={group.imageUrl}
                onOpen={() => router.push(`/community/groups/${group.id}`)}
              />
            ))}
          </div>
        )
      ) : null}

      {active === "canales" ? (
        !hasCapability(CAPABILITIES.channelView) ? (
          <EmptyState
            title="Sin acceso"
            description="Los canales no están disponibles para tu cuenta."
          />
        ) : (
          <div className="space-y-3">
            {accessibleChannels.length === 0 ? (
              <EmptyState
                title="No hay canales disponibles"
                description="Cuando tengas acceso a un canal de tu comunidad, aparecerá aquí."
              />
            ) : (
              accessibleChannels.map((channel) => {
                const label = channelAccessLabel({
                  allowed: true,
                  reason: "accessible",
                  requiresVerifiedResidency: channel.requiresVerifiedResidency,
                  type: channel.type,
                });
                const toneClass =
                  label.tone === "ok"
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-action-primary)]";
                return (
                  <article
                    key={channel.id}
                    className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                        {channel.type}
                      </p>
                      <h3 className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                        {channel.name}
                      </h3>
                      {channel.description ? (
                        <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                          {channel.description}
                        </p>
                      ) : null}
                    </div>
                    <p className={`mt-3 text-[13px] font-semibold ${toneClass}`}>
                      {label.badge}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        )
      ) : null}

      {active === "propuestas" ? (
        <CommunityFeed
          empty={
            <EmptyState
              title="No hay propuestas abiertas"
              description="Cuando alguien proponga algo, lo verás aquí para decidir juntos."
            />
          }
        >
          {proposals.map((item) => (
            <CommunityPostCard
              key={item.id}
              title={item.title}
              body={item.body}
              typeLabel="Propuesta"
              authorName={item.author.name}
              authorAvatarUrl={item.author.avatarUrl}
              meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
              decisionStatus={decisionLabel(item.decisionStatus)}
              onOpen={() => router.push(`/community/content/${item.id}`)}
              reactionBar={renderReactionBar(item)}
            />
          ))}
        </CommunityFeed>
      ) : null}

      {active === "participacion" ? (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
            <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
              Participa en tu territorio
            </h2>
            <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
              Decisiones abiertas, propuestas en curso y formas de aportar —
              sin convertir Comunidad en un chat.
            </p>
            <button
              type="button"
              className="mt-3 min-h-[44px] text-[14px] font-semibold text-[var(--color-action-primary)]"
              onClick={() => {
                setArea("propuestas");
                router.replace(communityHubHref("propuestas"));
              }}
            >
              Ver todas las propuestas →
            </button>
          </div>
          <CommunityFeed
            empty={
              <EmptyState
                title="Nada pendiente de tu participación"
                description="Cuando haya decisiones abiertas, aparecerán aquí."
              />
            }
          >
            {participation.map((item) => (
              <CommunityPostCard
                key={item.id}
                title={item.title}
                body={item.body}
                typeLabel="Participación"
                authorName={item.author.name}
                authorAvatarUrl={item.author.avatarUrl}
                meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
                decisionStatus={decisionLabel(item.decisionStatus)}
                onOpen={() => router.push(`/community/content/${item.id}`)}
                reactionBar={renderReactionBar(item)}
              />
            ))}
          </CommunityFeed>
        </div>
      ) : null}

      {active === "espacios" ? (
        espacios.length === 0 ? (
          <EmptyState
            title="Aún no hay espacios listados"
            description="Los espacios compartidos del territorio aparecerán aquí."
          />
        ) : (
          <div className="space-y-3">
            {espacios.map((space) => (
              <article
                key={space.id}
                className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]"
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {space.type === "space" ? "Espacio" : "Amenidad"}
                </p>
                <h3 className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                  {space.name}
                </h3>
                <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                  {space.description}
                </p>
                <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
                  {[space.areaLabel, space.location, space.availabilityPreview]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {space.bookable ? (
                  <button
                    type="button"
                    className="mt-3 min-h-[44px] text-[14px] font-semibold text-[var(--color-action-primary)]"
                    onClick={() => router.push(`/resources/${space.id}`)}
                  >
                    Ver espacio →
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )
      ) : null}

      {active === "mascotas" ? (
        mascotasItems.length === 0 ? (
          <EmptyState
            title="Mascotas en la comunidad"
            description="Aquí vivirá lo relacionado con mascotas del territorio — vecinos, lugares y cuidados."
          />
        ) : (
          <div className="space-y-3">
            {mascotasItems.map((item) => {
              if (item.kind === "place") {
                return (
                  <article
                    key={`place-${item.place.id}`}
                    className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      Lugar · {item.place.categoryLabel}
                    </p>
                    <h3 className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                      {item.place.name}
                    </h3>
                    <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                      {item.place.story}
                    </p>
                    <button
                      type="button"
                      className="mt-3 min-h-[44px] text-[14px] font-semibold text-[var(--color-action-primary)]"
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
                    className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      Trabajo · {item.post.categoryLabel}
                    </p>
                    <h3 className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                      {item.post.title}
                    </h3>
                    <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                      {item.post.description}
                    </p>
                    <button
                      type="button"
                      className="mt-3 min-h-[44px] text-[14px] font-semibold text-[var(--color-action-primary)]"
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
                  className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]"
                >
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                    Grupo
                  </p>
                  <h3 className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                    {item.group.name}
                  </h3>
                  <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                    {item.group.description}
                  </p>
                  <button
                    type="button"
                    className="mt-3 min-h-[44px] text-[14px] font-semibold text-[var(--color-action-primary)]"
                    onClick={() =>
                      router.push(`/community/groups/${item.group.id}`)
                    }
                  >
                    Abrir grupo →
                  </button>
                </article>
              );
            })}
          </div>
        )
      ) : null}
    </MobileScreen>
  );
}

function decisionLabel(status?: string) {
  if (status === "closing_soon") return "Cierra pronto";
  if (status === "closed") return "Cerrada";
  if (status === "open") return "Abierta";
  return undefined;
}

/** @deprecated Use CommunityHubScreen — kept for existing imports. */
export const CommunityScreen = CommunityHubScreen;
