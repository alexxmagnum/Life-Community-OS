"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  contentTypeLabel,
  formatContentWhen,
  getExperienceById,
  listAccessibleChannels,
  listGroups,
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
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";
import { channelAccessLabel } from "@/lib/demo-access-copy";

/**
 * Comunidad answers: "Who is here and what are people doing?"
 * Plans appear as community life in Descubrir — not as a Comunidad module.
 */
type Chip = "conversaciones" | "grupos" | "propuestas" | "canales";

function decisionLabel(status?: string) {
  if (status === "closing_soon") return "Cierra pronto";
  if (status === "closed") return "Cerrada";
  if (status === "open") return "Abierta";
  return undefined;
}

function resolveChip(raw: string | null): Chip | null {
  if (!raw) return null;
  if (
    raw === "conversaciones" ||
    raw === "grupos" ||
    raw === "propuestas" ||
    raw === "canales"
  ) {
    return raw;
  }
  const legacy: Record<string, Chip> = {
    feed: "conversaciones",
    talk: "conversaciones",
    groups: "grupos",
    decide: "propuestas",
    experiences: "conversaciones",
    channels: "canales",
  };
  return legacy[raw] ?? null;
}

export function CommunityScreen() {
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

  const accessibleChannels = useMemo(
    () => listAccessibleChannels(demoPersonId),
    [demoPersonId],
  );

  const chips = (
    [
      {
        id: "conversaciones" as const,
        label: "Conversaciones",
        enabled: isFeatureEnabled("feed") || isFeatureEnabled("interactions"),
      },
      {
        id: "grupos" as const,
        label: "Grupos",
        enabled:
          isFeatureEnabled("groups") && isModuleEnabled("community.groups"),
      },
      {
        id: "canales" as const,
        label: "Canales",
        enabled:
          isFeatureEnabled("communityChannels") ||
          isFeatureEnabled("officialChannels"),
      },
      {
        id: "propuestas" as const,
        label: "Propuestas",
        enabled: isFeatureEnabled("decide"),
      },
    ] satisfies { id: Chip; label: string; enabled: boolean }[]
  ).filter((c) => c.enabled);

  const tabParam = searchParams.get("tab");
  const initial = resolveChip(tabParam);
  const [chip, setChip] = useState<Chip>(
    initial && chips.some((c) => c.id === initial)
      ? initial
      : chips[0]?.id ?? "conversaciones",
  );
  /** One open conversation row at a time — keeps the list compact. */
  const [openConversationId, setOpenConversationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const next = resolveChip(tabParam);
    if (next && chips.some((c) => c.id === next)) {
      setChip(next);
    }
    // chips length/ids only change with feature flags
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const active = chips.some((c) => c.id === chip) ? chip : chips[0]?.id;

  const canView = hasCapability(CAPABILITIES.contentView);
  const canReact = hasCapability(CAPABILITIES.interactionReact);
  const canComment = hasCapability(CAPABILITIES.interactionComment);
  const canSave = hasCapability(CAPABILITIES.interactionSave);
  const canReport = hasCapability(CAPABILITIES.interactionReport);

  const conversations = useMemo(
    () => feedItems.filter((c) => c.type !== "proposal"),
    [feedItems],
  );

  const proposals = useMemo(
    () => feedItems.filter((c) => c.type === "proposal"),
    [feedItems],
  );

  const groupItems = listGroups();

  if (!active) {
    return (
      <EmptyState
        title="La comunidad está tranquila"
        description="Aún no hay funciones de participación activadas."
      />
    );
  }

  if (!canView && active === "conversaciones") {
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

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Comunidad"
        subtitle="Pregunta, comparte y decide con tus vecinos."
      />

      <FilterChipRow
        items={chips.map((c) => ({ id: c.id, label: c.label }))}
        activeId={active}
        onChange={(id) => {
          const next = id as Chip;
          setChip(next);
          router.replace(`/community?tab=${next}`);
        }}
      />

      {active === "conversaciones" ? (
        <CommunityConversationList
          empty={
            <EmptyState
              title="Todavía no hay conversaciones"
              description="Pregunta algo útil o comparte una actualización: aquí vive la conversación del barrio."
            />
          }
        >
          {conversations.map((item) => {
            const linked = item.linkedExperienceId
              ? getExperienceById(item.linkedExperienceId)
              : undefined;
            const when = formatContentWhen(
              item.publishedAt ?? item.createdAt,
            );
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
      ) : null}

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
            <p className="text-[13px] leading-5 text-[var(--color-text-secondary)]">
              Organización de la información — no es un chat. Solo ves los
              espacios a los que tienes acceso.
            </p>
            {accessibleChannels.length === 0 ? (
              <EmptyState
                title="No hay espacios disponibles"
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
    </MobileScreen>
  );
}
