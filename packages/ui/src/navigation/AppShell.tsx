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
  /** @deprecated Create lives in bottom nav — keep false */
  showCreateFab?: boolean;
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
        {!immersive && showCreateFab && onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="fixed bottom-[76px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-action-primary)] text-2xl text-[var(--color-text-on-action)] shadow-[var(--shadow-elev-2)] transition-transform active:scale-95 md:hidden"
            aria-label="Añadir algo"
          >
            +
          </button>
        ) : null}
        {!immersive ? (
          <BottomNavigation
            items={items}
            activeId={activeId}
            onNavigate={onNavigate}
            notice={navNotice}
          />
        ) : null}
      </div>
    </div>
  );
}
