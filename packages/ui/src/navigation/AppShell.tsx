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
  items: NavItem[];
  activeId: NavItemId;
  onNavigate: (item: NavItem) => void;
  onCreate?: () => void;
  showCreateFab?: boolean;
  children: ReactNode;
  className?: string;
};

export function AppShell({
  brandName,
  items,
  activeId,
  onNavigate,
  onCreate,
  showCreateFab = true,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface-app)] text-[var(--color-text-primary)]">
      <DesktopNavigation
        brandName={brandName}
        items={items}
        activeId={activeId}
        onNavigate={onNavigate}
        onCreate={onCreate}
      />
      <div className="relative flex min-h-screen flex-1 flex-col">
        <main
          className={cn(
            "mx-auto w-full max-w-[390px] flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-3 md:max-w-[960px] md:px-8 md:pb-10 md:pt-8",
            className,
          )}
        >
          {children}
        </main>
        {showCreateFab && onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="fixed bottom-[76px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-action-primary)] text-2xl text-[var(--color-text-inverse)] shadow-[var(--shadow-elev-2)] transition-transform active:scale-95 md:hidden"
            aria-label="Añadir algo"
          >
            +
          </button>
        ) : null}
        <BottomNavigation
          items={items}
          activeId={activeId}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
