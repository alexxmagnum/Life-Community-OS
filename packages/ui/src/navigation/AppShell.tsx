"use client";

import type { ReactNode } from "react";

import {
  BottomNavigation,
  DesktopNavigation,
  type NavItem,
  type NavItemId,
} from "./Navigation";
import { cn } from "../lib/cn";

export type AppShellProps = {
  brandName: string;
  brandLogoUrl?: string;
  items: NavItem[];
  activeId: NavItemId;
  onNavigate: (item: NavItem) => void;
  onCreate?: () => void;
  /** Magic Plus — floating + above the tab bar. Not a nav destination. */
  showCreateFab?: boolean;
  createFabLabel?: string;
  /** Persistent mobile app header (fixed). */
  header?: ReactNode;
  /** Live notice carried by the floating tab bar. */
  navNotice?: ReactNode;
  /**
   * Full-screen messaging mode: hide app header + bottom nav.
   * Conversation chrome owns the viewport.
   */
  immersive?: boolean;
  /**
   * Let the first child (Home hero) own the top edge — no main top padding.
   * Pair with a transparent fixed header floating over photography.
   */
  flushTop?: boolean;
  children: ReactNode;
  className?: string;
};

export function AppShell({
  brandName,
  brandLogoUrl,
  items,
  activeId,
  onNavigate,
  onCreate,
  showCreateFab = false,
  createFabLabel = "Crear en comunidad",
  header,
  navNotice,
  immersive = false,
  flushTop = false,
  children,
  className,
}: AppShellProps) {
  const showHeader = Boolean(header) && !immersive;

  return (
    <div className="flex min-h-screen bg-[var(--life-bg,var(--color-surface-app))] text-[var(--color-text-primary)] [background-image:var(--gradient-surface-app)] [background-attachment:fixed]">
      {!immersive ? (
        <DesktopNavigation
          brandName={brandName}
          brandLogoUrl={brandLogoUrl}
          items={items}
          activeId={activeId}
          onNavigate={onNavigate}
          onCreate={onCreate}
        />
      ) : null}
      <div className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-[var(--life-bg,var(--color-surface-app))]">
        {showHeader ? header : null}
        <main
          className={cn(
            "mx-auto w-full max-w-none flex-1 overflow-x-hidden bg-[var(--life-bg,var(--color-surface-app))]",
            immersive
              ? "max-w-none px-0 pb-0 pt-0 md:max-w-none md:px-0 md:pb-0 md:pt-0"
              : cn(
                  "pb-[calc(94px+env(safe-area-inset-bottom))] md:max-w-[960px] md:px-8 md:pb-10 md:pt-8",
                  flushTop
                    ? "px-0 pt-0 md:pt-8"
                    : cn(
                        "px-2.5",
                        showHeader
                          ? "pt-[calc(var(--chrome-height)+env(safe-area-inset-top))] md:pt-8"
                          : "pt-3",
                      ),
                ),
            className,
          )}
        >
          {children}
        </main>
        {!immersive ? (
          <BottomNavigation
            items={items}
            activeId={activeId}
            onNavigate={onNavigate}
            notice={navNotice}
          />
        ) : null}
      </div>
      {!immersive && showCreateFab && onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="ui-fab ui-pop fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-1/2 z-[55] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[image:var(--gradient-brand)] text-[28px] font-light leading-none text-[var(--color-text-on-action)] shadow-[0_0_28px_rgba(0,212,229,0.55),0_8px_20px_rgba(0,0,0,0.45)] ring-[3px] ring-[var(--color-surface-app)]/70 md:hidden"
          aria-label={createFabLabel}
        >
          <span aria-hidden>+</span>
        </button>
      ) : null}
    </div>
  );
}
