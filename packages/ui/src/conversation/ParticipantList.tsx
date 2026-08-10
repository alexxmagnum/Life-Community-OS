"use client";

import { Avatar } from "../people/Avatar";
import { cn } from "../lib/cn";

export type ConversationParticipant = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type ConversationParticipantListProps = {
  participants: ConversationParticipant[];
  /** Optional caption (tenant terminology). */
  label?: string;
  className?: string;
};

/** Compact peer strip for conversation context (not experience RSVP list). */
export function ConversationParticipantList({
  participants,
  label,
  className,
}: ConversationParticipantListProps) {
  if (participants.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {participants.slice(0, 4).map((p, i) => (
          <span
            key={p.id}
            className="relative"
            style={{
              marginLeft: i === 0 ? 0 : -8,
              zIndex: participants.length - i,
            }}
          >
            <Avatar
              src={p.avatarUrl}
              alt={p.name}
              size="sm"
              zoomable={false}
            />
          </span>
        ))}
      </div>
      {label ? (
        <p className="truncate text-[13px] text-[var(--color-text-secondary)]">
          {label}
        </p>
      ) : null}
    </div>
  );
}
