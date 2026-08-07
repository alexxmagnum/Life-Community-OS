"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  contentTypeLabel,
  formatContentWhen,
  formatExperienceWhen,
  getExperienceById,
  listDiscoverableExperiences,
  listGroups,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommentPreview,
  CommunityFeed,
  CommunityPostCard,
  EmptyState,
  ExperienceCard,
  FilterChipRow,
  GroupCard,
  MobileScreen,
  ReactionBar,
  ScreenHeader,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

type Chip = "feed" | "groups" | "talk" | "decide" | "experiences";

function decisionLabel(status?: string) {
  if (status === "closing_soon") return "Cierra pronto";
  if (status === "closed") return "Cerrada";
  if (status === "open") return "Abierta";
  return undefined;
}

export function CommunityScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();
  const {
    feedItems,
    getMyReaction,
    isSaved,
    isReported,
    toggleReaction,
    toggleSave,
    reportContent,
  } = useCommunityInteractions();

  const chips = (
    [
      { id: "feed" as const, label: "Novedades", enabled: isFeatureEnabled("feed") },
      {
        id: "experiences" as const,
        label: "Planes",
        enabled: isFeatureEnabled("experiences"),
      },
      {
        id: "groups" as const,
        label: "Grupos",
        enabled: isFeatureEnabled("groups"),
      },
      {
        id: "talk" as const,
        label: "Conversar",
        enabled: isFeatureEnabled("interactions"),
      },
      {
        id: "decide" as const,
        label: "Decidir",
        enabled: isFeatureEnabled("decide"),
      },
    ] satisfies { id: Chip; label: string; enabled: boolean }[]
  ).filter((c) => c.enabled);

  const tabParam = searchParams.get("tab");
  const [chip, setChip] = useState<Chip>(
    tabParam === "groups" && chips.some((c) => c.id === "groups")
      ? "groups"
      : chips[0]?.id ?? "feed",
  );

  useEffect(() => {
    if (tabParam === "groups" && chips.some((c) => c.id === "groups")) {
      setChip("groups");
    }
  }, [tabParam, chips]);

  const active = chips.some((c) => c.id === chip) ? chip : chips[0]?.id;

  const canView = hasCapability(CAPABILITIES.contentView);
  const canReact = hasCapability(CAPABILITIES.interactionReact);
  const canComment = hasCapability(CAPABILITIES.interactionComment);
  const canSave = hasCapability(CAPABILITIES.interactionSave);
  const canReport = hasCapability(CAPABILITIES.interactionReport);

  const discussions = useMemo(
    () =>
      feedItems.filter(
        (c) => c.type === "discussion" || c.type === "member_update",
      ),
    [feedItems],
  );

  const proposals = useMemo(
    () => feedItems.filter((c) => c.type === "proposal"),
    [feedItems],
  );

  const experiences = listDiscoverableExperiences().slice(0, 4);
  const groupItems = listGroups();

  if (!active) {
    return (
      <EmptyState
        title="La comunidad está tranquila"
        description="Aún no hay funciones de participación activadas."
      />
    );
  }

  if (!canView && active === "feed") {
    return (
      <EmptyState
        title="Sin acceso"
        description="El contenido de la comunidad no está disponible para tu cuenta."
      />
    );
  }

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Comunidad"
        subtitle="Qué está pasando: avisos, conversaciones y decisiones."
      />

      <FilterChipRow
        items={chips.map((c) => ({ id: c.id, label: c.label }))}
        activeId={active}
        onChange={(id) => {
          const next = id as Chip;
          setChip(next);
          if (next === "groups") {
            router.replace("/community?tab=groups");
          } else {
            router.replace("/community");
          }
        }}
      />

      {active === "feed" ? (
        <CommunityFeed
          empty={
            <EmptyState
              title="Todavía no hay nada"
              description="Sé la primera persona en compartir algo útil."
            />
          }
        >
          {feedItems.map((item) => {
            const preview = item.comments[0];
            const linked = item.linkedExperienceId
              ? getExperienceById(item.linkedExperienceId)
              : undefined;
            return (
              <CommunityPostCard
                key={item.id}
                title={item.title}
                body={item.body}
                typeLabel={contentTypeLabel(item.type)}
                official={item.isOfficial}
                authorName={item.author.name}
                authorAvatarUrl={item.author.avatarUrl}
                meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
                areaLabel={item.areaLabel}
                imageUrl={item.imageUrl}
                decisionStatus={decisionLabel(item.decisionStatus)}
                experienceLinkLabel={linked?.title}
                onOpen={() => router.push(`/community/content/${item.id}`)}
                commentPreview={
                  preview ? (
                    <CommentPreview
                      authorName={preview.author.name}
                      body={preview.body}
                      avatarUrl={preview.author.avatarUrl}
                      meta={formatContentWhen(preview.createdAt)}
                    />
                  ) : null
                }
                reactionBar={
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
                    onAcknowledge={() =>
                      toggleReaction(item.id, "acknowledge")
                    }
                    onSupport={() => toggleReaction(item.id, "support")}
                    onComment={() =>
                      router.push(`/community/content/${item.id}`)
                    }
                    onSave={() => toggleSave(item.id)}
                    onReport={
                      canReport
                        ? () => {
                            reportContent(item.id);
                          }
                        : undefined
                    }
                  />
                }
              />
            );
          })}
        </CommunityFeed>
      ) : null}

      {active === "experiences" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {experiences.map((exp) => (
            <ExperienceCard
              key={exp.id}
              title={exp.title}
              when={formatExperienceWhen(exp.startsAt)}
              where={exp.location}
              meta={`${exp.participantCount} van`}
              imageUrl={exp.imageUrl}
              organizerName={exp.organizer.name}
              ctaLabel="Ver"
              onClick={() => router.push(`/experiences/${exp.id}`)}
              onCta={() => router.push(`/experiences/${exp.id}`)}
            />
          ))}
        </div>
      ) : null}

      {active === "groups" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {groupItems.map((group) => (
            <GroupCard
              key={group.id}
              name={group.name}
              members={group.memberCount}
              imageUrl={group.imageUrl}
            />
          ))}
        </div>
      ) : null}

      {active === "talk" ? (
        <CommunityFeed
          empty={
            <EmptyState
              title="No hay conversaciones abiertas"
              description="Empieza una desde Participar (+)."
            />
          }
        >
          {discussions.map((item) => (
            <CommunityPostCard
              key={item.id}
              title={item.title}
              body={item.body}
              typeLabel={contentTypeLabel(item.type)}
              authorName={item.author.name}
              authorAvatarUrl={item.author.avatarUrl}
              meta={formatContentWhen(item.publishedAt ?? item.createdAt)}
              areaLabel={item.areaLabel}
              onOpen={() => router.push(`/community/content/${item.id}`)}
              reactionBar={
                <ReactionBar
                  acknowledgeCount={item.reactionCounts.acknowledge}
                  supportCount={item.reactionCounts.support}
                  myReaction={getMyReaction(item.id)}
                  commentCount={item.commentCount}
                  canReact={canReact}
                  canComment={canComment}
                  canSave={false}
                  onAcknowledge={() => toggleReaction(item.id, "acknowledge")}
                  onSupport={() => toggleReaction(item.id, "support")}
                  onComment={() =>
                    router.push(`/community/content/${item.id}`)
                  }
                />
              }
            />
          ))}
        </CommunityFeed>
      ) : null}

      {active === "decide" ? (
        <CommunityFeed
          empty={
            <EmptyState
              title="No hay decisiones abiertas"
              description="Las propuestas aparecerán aquí cuando existan."
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
              reactionBar={
                <ReactionBar
                  acknowledgeCount={item.reactionCounts.acknowledge}
                  supportCount={item.reactionCounts.support}
                  myReaction={getMyReaction(item.id)}
                  commentCount={item.commentCount}
                  canReact={canReact}
                  canComment={canComment}
                  canSave={canSave}
                  onAcknowledge={() => toggleReaction(item.id, "acknowledge")}
                  onSupport={() => toggleReaction(item.id, "support")}
                  onComment={() =>
                    router.push(`/community/content/${item.id}`)
                  }
                  onSave={() => toggleSave(item.id)}
                />
              }
            />
          ))}
        </CommunityFeed>
      ) : null}
    </MobileScreen>
  );
}
