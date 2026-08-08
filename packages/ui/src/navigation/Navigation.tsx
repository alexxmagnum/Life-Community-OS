"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type NavItemId =
  | "home"
  | "community"
  | "create"
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
      <ul className="mx-auto flex max-w-lg items-end justify-between gap-0.5 px-1.5 pt-1.5">
        {items.map((item) => {
          const active = item.id === activeId;
          const isCreate = item.id === "create";

          if (isCreate) {
            return (
              <li key={item.id} className="flex flex-1 justify-center pb-1">
                <button
                  type="button"
                  onClick={() => onNavigate(item)}
                  className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-action-primary)] text-[28px] leading-none text-[var(--color-text-inverse)] shadow-[var(--shadow-elev-2)] transition-transform active:scale-95"
                  aria-label={item.label}
                >
                  <span aria-hidden>+</span>
                </button>
              </li>
            );
          }

          return (
            <li key={item.id} className="flex-1">
              <a
                href={item.href}
                onClick={(e) => {
                  if (
                    e.defaultPrevented ||
                    e.button !== 0 ||
                    e.metaKey ||
                    e.altKey ||
                    e.ctrlKey ||
                    e.shiftKey
                  ) {
                    return;
                  }
                  e.preventDefault();
                  onNavigate(item);
                }}
                className={cn(
                  "flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] text-[10px] font-semibold",
                  active
                    ? "text-[var(--color-action-primary)]"
                    : "text-[var(--color-text-tertiary)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-[var(--color-action-primary)] text-[var(--color-text-inverse)]"
                      : "text-[var(--color-text-tertiary)]",
                  )}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="truncate px-0.5">{item.label}</span>
              </a>
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
  createLabel = "Crear",
  className,
}: DesktopNavigationProps) {
  const linkItems = items.filter((item) => item.id !== "create");

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
        {linkItems.map((item) => {
          const active = item.id === activeId;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (
                  e.defaultPrevented ||
                  e.button !== 0 ||
                  e.metaKey ||
                  e.altKey ||
                  e.ctrlKey ||
                  e.shiftKey
                ) {
                  return;
                }
                e.preventDefault();
                onNavigate(item);
              }}
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
            </a>
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
