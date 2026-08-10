"use client";

import type { ReactNode } from "react";

import { Avatar } from "../people/Avatar";
import { cn } from "../lib/cn";

export type ContextHeaderCard = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  statusLabel?: string;
  onClick?: () => void;
};

export type ContextHeaderProps = {
  /** Peer / group display name (Who). */
  name: string;
  avatarUrl?: string;
  /** Why this conversation exists — single secondary line. */
  reason: string;
  /** About what — context entity (used for tap target / a11y). */
  context: ContextHeaderCard;
  /** Navigate back to previous screen. */
  onBack?: () => void;
  /** Optional leave / exit. */
  onExit?: () => void;
  /** Optional trailing actions (moderation, etc.). */
  trailing?: ReactNode;
  className?: string;
};

/**
 * Compact messaging header — name + members/context.
 * Tap opens ConversationInfoSheet (not a separate page).
 */
export function ContextHeader({
  name,
  avatarUrl,
  reason,
  context,
  onBack,
  onExit,
  trailing,
  className,
}: ContextHeaderProps) {
  const title = (name || context.title || "").trim() || "Conversación";
  const secondary = (reason || context.subtitle || "").trim();

  return (
    <header
      className={cn(
        "flex min-h-[52px] items-center gap-1.5 py-1.5 pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px] font-semibold text-[var(--color-action-primary)]"
          aria-label="Volver"
        >
          ←
        </button>
      ) : null}

      <button
        type="button"
        onClick={context.onClick}
        disabled={!context.onClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 text-left",
          context.onClick ? "active:opacity-80" : "",
        )}
        aria-label={`Conversación con ${title}. ${secondary}`}
      >
        <Avatar src={avatarUrl} alt={title} size="sm" zoomable={false} />
        <span className="min-w-0 flex-1 py-0.5">
          <span className="block truncate text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
            {title}
          </span>
          {secondary ? (
            <span className="mt-0.5 block truncate text-[12px] leading-4 text-[var(--color-text-secondary)]">
              {secondary}
            </span>
          ) : null}
        </span>
      </button>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}

      {onExit ? (
        <button
          type="button"
          onClick={onExit}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[16px] text-[var(--color-text-tertiary)]"
          aria-label="Salir"
        >
          ×
        </button>
      ) : null}
    </header>
  );
}
