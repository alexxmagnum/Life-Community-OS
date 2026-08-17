"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type NavItemId =
  | "home"
  | "community"
  | "create"
  | "services"
  | "map"
  /** @deprecated Kept for route active-state mapping; not a bottom-tab destination. */
  | "discover"
  /** @deprecated Commerce lives under Servicios; kept for active-state mapping. */
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
  /** Live community notice carried inside the floating bar. */
  notice?: ReactNode;
  className?: string;
};

/**
 * Floating glass tab bar. The bar detaches from the screen edge and, when the
 * community has something urgent to say, carries it as a first row.
 */
export function BottomNavigation({
  items,
  activeId,
  onNavigate,
  notice,
  className,
}: BottomNavigationProps) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-2 pb-[calc(env(safe-area-inset-bottom)+6px)] md:hidden",
        className,
      )}
      aria-label="Principal"
    >
      <div className="overflow-visible rounded-[22px] border border-[var(--color-border-glass)] bg-[var(--color-chrome-surface)] shadow-[var(--shadow-elev-2)] backdrop-blur-2xl">
        {notice ? (
          <div className="border-b border-[var(--color-border-glass)] px-3 py-1.5">
            {notice}
          </div>
        ) : null}
        <ul className="flex w-full items-end justify-between gap-0.5 px-1.5 pb-1 pt-1.5">
          {items.map((item) => {
            const active = item.id === activeId;
            const isCreate = item.id === "create";

            if (isCreate) {
              return (
                <li key={item.id} className="flex flex-1 justify-center">
                  <button
                    type="button"
                    onClick={() => onNavigate(item)}
                    className="-mt-6 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[image:var(--gradient-brand)] text-[24px] leading-none text-[var(--color-text-on-action)] shadow-[0_0_24px_rgba(0,212,229,0.55),0_8px_20px_rgba(0,0,0,0.45)] ring-[3px] ring-[var(--color-surface-app)]/70 transition-transform active:scale-95"
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
                    "flex w-full flex-col items-center justify-center gap-[3px] py-0.5 text-[9.5px] font-semibold",
                    active
                      ? "text-[var(--color-accent-cyan)]"
                      : "text-[var(--color-text-tertiary)]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-[10px] transition-colors [&_svg]:h-[17px] [&_svg]:w-[17px]",
                      active
                        ? "bg-[image:var(--gradient-brand)] text-[var(--color-text-on-action)]"
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
      </div>
    </nav>
  );
}

export type DesktopNavigationProps = {
  brandName: string;
  brandLogoUrl?: string;
  items: NavItem[];
  activeId: NavItemId;
  onNavigate: (item: NavItem) => void;
  onCreate?: () => void;
  createLabel?: string;
  className?: string;
};

export function DesktopNavigation({
  brandName,
  brandLogoUrl,
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
      <div className="flex items-center gap-2.5 px-3">
        {brandLogoUrl ? (
          <img
            src={brandLogoUrl}
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
        ) : null}
        <p className="font-[family-name:var(--font-display)] text-[20px] font-semibold text-[var(--color-action-primary)]">
          {brandName}
        </p>
      </div>
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
          className="mt-auto flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-on-action)]"
        >
          {createLabel}
        </button>
      ) : null}
    </aside>
  );
}
