"use client";

import { useEffect, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type ConversationShellProps = {
  /** Compact conversation chrome (back + who / context). */
  header: ReactNode;
  /** Scrollable message region — primary surface. */
  children: ReactNode;
  /** Fixed bottom composer — always visible. */
  footer?: ReactNode;
  /** Panel flush under chat header (e.g. ConversationInfoSheet). */
  headerOverlay?: ReactNode;
  className?: string;
  messagesLabel?: string;
};

/**
 * Universal messaging layout inside the app shell.
 * Sits under CommunityAppHeader and above BottomNavigation.
 *
 * Height must match AppShell main padding exactly:
 *   pt = 52px + safe-top · pb = 88px + safe-bottom
 * Otherwise the page scrolls and the chat header slides under the fixed app header.
 */
export function ConversationShell({
  header,
  children,
  footer,
  headerOverlay,
  className,
  messagesLabel = "Mensajes",
}: ConversationShellProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <div
      className={cn(
        // Must equal 100dvh − AppShell main pt − AppShell main pb (see AppShell).
        "flex h-[calc(100dvh-52px-88px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-[calc(100dvh-52px-88px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-[var(--color-surface-app)]",
        "-mx-2.5 md:-mx-0",
        className,
      )}
    >
      <div className="relative z-20 shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-app)] px-2">
        {header}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {headerOverlay}

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2"
          role="log"
          aria-live="polite"
          aria-label={messagesLabel}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-app)] px-2 pb-1.5 pt-1.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
