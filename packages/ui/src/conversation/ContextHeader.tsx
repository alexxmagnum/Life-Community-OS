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
  /** Peer display name (Who). */
  name: string;
  avatarUrl?: string;
  /** Why this conversation exists. */
  reason: string;
  /** About what — context entity card. */
  context: ContextHeaderCard;
  /** Optional trailing actions. */
  trailing?: ReactNode;
  className?: string;
};

/**
 * Answers Who? Why? About what? for every private / contextual conversation.
 */
export function ContextHeader({
  name,
  avatarUrl,
  reason,
  context,
  trailing,
  className,
}: ContextHeaderProps) {
  const cardInner = (
    <>
      {context.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={context.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
        />
      ) : (
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-surface-muted)] text-[15px] font-semibold text-[var(--color-text-tertiary)]"
          aria-hidden
        >
          {context.title.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
          {context.title}
        </span>
        {context.subtitle ? (
          <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-secondary)]">
            {context.subtitle}
          </span>
        ) : null}
        {context.statusLabel ? (
          <span className="mt-1 inline-block rounded-full bg-[var(--color-action-primary-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-action-primary)]">
            {context.statusLabel}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <header
      className={cn(
        "space-y-3 border-b border-[var(--color-border-subtle)] pb-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar src={avatarUrl} alt={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-[var(--color-text-primary)]">
            {name}
          </p>
          <p className="truncate text-[13px] text-[var(--color-text-secondary)]">
            {reason}
          </p>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>

      {context.onClick ? (
        <button
          type="button"
          onClick={context.onClick}
          className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] p-2.5 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
          aria-label={`Sobre: ${context.title}`}
        >
          {cardInner}
        </button>
      ) : (
        <div
          className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] p-2.5 shadow-[var(--shadow-elev-1)]"
          aria-label={`Sobre: ${context.title}`}
        >
          {cardInner}
        </div>
      )}
    </header>
  );
}
