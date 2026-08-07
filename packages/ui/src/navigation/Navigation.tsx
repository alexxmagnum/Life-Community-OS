"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type NavItemId =
  | "home"
  | "community"
  | "discover"
  | "marketplace"
  | "me"
  | "calendar";

export type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  icon: ReactNode;
};

export type BottomNavigationProps = {
  items: NavItem[];
  activeId: NavItemId;
  onNavigate: (item: NavItem) => void;
  className?: string;
};

export function BottomNavigation({
  items,
  activeId,
  onNavigate,
  className,
}: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] pb-[env(safe-area-inset-bottom)] md:hidden",
        className,
      )}
      aria-label="Principal"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-2">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate(item)}
                className={cn(
                  "flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] text-[12px] font-semibold",
                  active
                    ? "text-[var(--color-action-primary)]"
                    : "text-[var(--color-text-tertiary)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-xl" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type DesktopNavigationProps = {
  brandName: string;
  items: NavItem[];
  activeId: NavItemId;
  onNavigate: (item: NavItem) => void;
  onCreate?: () => void;
  createLabel?: string;
  className?: string;
};

export function DesktopNavigation({
  brandName,
  items,
  activeId,
  onNavigate,
  onCreate,
  createLabel = "Añadir",
  className,
}: DesktopNavigationProps) {
  return (
    <aside
      className={cn(
        "hidden h-screen w-[240px] shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 py-6 md:flex",
        className,
      )}
    >
      <p className="px-3 font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-action-primary)]">
        {brandName}
      </p>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Principal">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item)}
              className={cn(
                "flex min-h-[48px] items-center gap-3 rounded-[var(--radius-md)] px-3 text-[16px] font-semibold transition-colors",
                active
                  ? "bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-auto flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)]"
        >
          {createLabel}
        </button>
      ) : null}
    </aside>
  );
}
