"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  contentTypeLabel,
  formatContentWhen,
  formatExperienceWhen,
  getExperienceById,
  groups,
  listDiscoverableExperiences,
} from "@life-community-os/tenant-life-panoramica";
import {
  CommentPreview,
  CommunityFeed,
  CommunityPostCard,
  EmptyState,
  ExperienceCard,
  GroupCard,
  ReactionBar,
  cn,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCommunityInteractions } from "@/providers/CommunityInteractionProvider";

type Chip = "feed" | "groups" | "talk" | "decide" | "experiences";

function decisionLabel(status?: string) {
  if (status === "closing_soon") return "Closing soon";
  if (status === "closed") return "Closed";
  if (status === "open") return "Open";
  return undefined;
}

export function CommunityScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const {
    feedItems,
    getMyReaction,
    isSaved,
    isReported,
    toggleReaction,
    toggleSave,
    reportContent,
  } = useCommunityInteractions();
  const [chip, setChip] = useState<Chip>("feed");

  const chips = (
    [
      { id: "feed" as const, label: "Feed", enabled: isFeatureEnabled("feed") },
      {
        id: "experiences" as const,
        label: "Experiences",
        enabled: isFeatureEnabled("experiences"),
      },
      {
        id: "groups" as const,
        label: "Groups",
        enabled: isFeatureEnabled("groups"),
      },
      {
        id: "talk" as const,
        label: "Talk",
        enabled: isFeatureEnabled("interactions"),
      },
      {
        id: "decide" as const,
        label: "Decide",
        enabled: isFeatureEnabled("decide"),
      },
    ] satisfies { id: Chip; label: string; enabled: boolean }[]
  ).filter((c) => c.enabled);

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

  if (!active) {
    return (
      <EmptyState
        title="Community is quiet"
        description="Participation features aren’t enabled for this community yet."
      />
    );
  }

  if (!canView && active === "feed") {
    return (
      <EmptyState
        title="You don’t have access"
        description="Community content isn’t available for your account."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
          Community
        </h1>
        <p className="mt-1 text-[16px] text-[var(--color-text-secondary)]">
          Official updates, neighbour contributions, and useful discussions.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-[var(--color-surface-app)]/95 px-4 py-2 backdrop-blur">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChip(c.id)}
            className={cn(
              "min-h-[40px] shrink-0 rounded-full px-4 text-[14px] font-semibold",
              active === c.id
                ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {active === "feed" ? (
        <CommunityFeed
          empty={
            <EmptyState
              title="Nothing here yet"
              description="Be the first to share something useful."
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
              meta={`${exp.participantCount} going`}
              imageUrl={exp.imageUrl}
              organizerName={exp.organizer.name}
              ctaLabel="View"
              onClick={() => router.push(`/experiences/${exp.id}`)}
              onCta={() => router.push(`/experiences/${exp.id}`)}
            />
          ))}
        </div>
      ) : null}

      {active === "groups" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              name={group.name}
              members={group.members}
              imageUrl={group.imageUrl}
            />
          ))}
        </div>
      ) : null}

      {active === "talk" ? (
        <CommunityFeed
          empty={
            <EmptyState
              title="No open discussions"
              description="Start a useful conversation from Create."
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
              title="No open decisions"
              description="Proposals will appear here when available."
            />
          }
        >
          {proposals.map((item) => (
            <CommunityPostCard
              key={item.id}
              title={item.title}
              body={item.body}
              typeLabel="Proposal"
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
    </div>
  );
}
