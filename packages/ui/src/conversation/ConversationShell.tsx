"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type ConversationShellProps = {
  /** Sticky top: typically ContextHeader or FlowScreenHeader + ContextHeader. */
  header: ReactNode;
  /** Scrollable message region. */
  children: ReactNode;
  /** Sticky bottom composer / quick actions. */
  footer?: ReactNode;
  className?: string;
  /** Accessible name for the message region. */
  messagesLabel?: string;
};

/**
 * Mobile-first conversation layout: header · scroll · sticky composer.
 * Replaces duplicated feed-style conversation screens.
 */
export function ConversationShell({
  header,
  children,
  footer,
  className,
  messagesLabel = "Mensajes",
}: ConversationShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100dvh-8.5rem)] flex-col",
        className,
      )}
    >
      <div className="shrink-0">{header}</div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3"
        role="log"
        aria-live="polite"
        aria-label={messagesLabel}
      >
        {children}
      </div>
      {footer ? (
        <div className="sticky bottom-0 z-[2] shrink-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
