"use client";

import { useState } from "react";
import {
  feedPosts,
  groups,
  proposals,
} from "@life-community-os/tenant-life-panoramica";
import {
  AnnouncementCard,
  CommunityCard,
  EmptyState,
  GroupCard,
} from "@life-community-os/ui";
import { cn } from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";

type Chip = "feed" | "groups" | "talk" | "decide";

export function CommunityScreen() {
  const { isFeatureEnabled } = useTenant();
  const [chip, setChip] = useState<Chip>("feed");

  const chips = (
    [
      { id: "feed" as const, label: "Feed", enabled: isFeatureEnabled("feed") },
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

  if (!active) {
    return (
      <EmptyState
        title="Community is quiet"
        description="Participation features aren’t enabled for this community yet."
      />
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
        Community
      </h1>

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
        <div className="space-y-4">
          {feedPosts.map((post) =>
            post.kind === "official" ? (
              <AnnouncementCard
                key={post.id}
                title={post.title}
                preview={post.body}
                area={post.meta}
              />
            ) : (
              <CommunityCard
                key={post.id}
                author={post.author}
                title={post.title}
                body={post.body}
                meta={post.meta}
                reactions={post.reactions}
                comments={post.comments}
              />
            ),
          )}
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
        <div className="space-y-3">
          <CommunityCard
            author="Neighbour circle"
            title="Evening walk toward Detinsa"
            body="Last reply: “See you at the path entrance.”"
            meta="Open discussion"
            comments={6}
          />
          <CommunityCard
            title="Pool hours for August"
            body="Thread for questions before the decision closes."
            meta="Linked to Decide"
            comments={11}
          />
        </div>
      ) : null}

      {active === "decide" ? (
        <div className="space-y-3">
          {proposals.map((p) => (
            <button
              key={p.id}
              type="button"
              className="w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)]"
            >
              <span className="inline-flex rounded-full bg-[var(--color-feedback-warning-subtle)] px-3 py-1 text-[12px] font-semibold text-[var(--color-feedback-warning)]">
                {p.status}
              </span>
              <h3 className="mt-2 text-[18px] font-semibold">{p.title}</h3>
              <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
                {p.meta}
              </p>
              <span className="mt-4 inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[var(--color-action-primary)]">
                Participate →
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
