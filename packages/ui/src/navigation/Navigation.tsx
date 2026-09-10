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
  /** Central Magic Plus — rendered as the elevated FAB between tabs. */
  onCreate?: () => void;
  createLabel?: string;
  /** Live community notice carried inside the floating bar. */
  notice?: ReactNode;
  className?: string;
};

/**
 * Edge-to-edge glass tab bar — Inicio · Comunidad · + · Servicios · Perfil.
 */
export function BottomNavigation({
  items,
  activeId,
  onNavigate,
  onCreate,
  createLabel = "Crear",
  notice,
  className,
}: BottomNavigationProps) {
  const linkItems = items.filter((item) => item.id !== "create");
  const mid = Math.ceil(linkItems.length / 2);
  const left = linkItems.slice(0, mid);
  const right = linkItems.slice(mid);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        className,
      )}
      aria-label="Principal"
    >
      <div className="overflow-visible rounded-t-[28px] border border-b-0 border-white/[0.1] bg-[rgba(5,7,8,0.94)] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {notice ? (
          <div className="border-b border-white/[0.08] px-3 py-1.5">
            {notice}
          </div>
        ) : null}
        <ul className="flex w-full items-end justify-between gap-0.5 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
          {left.map((item) => (
            <BottomNavLink
              key={item.id}
              item={item}
              active={item.id === activeId}
              onNavigate={onNavigate}
            />
          ))}

          {onCreate ? (
            <li className="flex flex-1 justify-center pb-1">
              <button
                type="button"
                onClick={onCreate}
                className="-mt-7 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-accent-cyan)_0%,var(--color-accent-turquoise)_55%,var(--color-accent-lime)_100%)] text-[30px] font-light leading-none text-[#050708] shadow-[0_8px_28px_rgba(0,212,229,0.45),0_4px_14px_rgba(0,0,0,0.4)] ring-[4px] ring-[rgba(5,7,8,0.92)] transition-transform active:scale-95"
                aria-label={createLabel}
              >
                <span aria-hidden>+</span>
              </button>
            </li>
          ) : null}

          {right.map((item) => (
            <BottomNavLink
              key={item.id}
              item={item}
              active={item.id === activeId}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function BottomNavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: (item: NavItem) => void;
}) {
  return (
    <li className="flex-1">
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
          "flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold",
          active
            ? "text-[var(--color-accent-cyan)]"
            : "text-white/55",
        )}
        aria-current={active ? "page" : undefined}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center transition-colors [&_svg]:h-[20px] [&_svg]:w-[20px]",
            active ? "text-[var(--color-accent-cyan)]" : "text-white/55",
          )}
          aria-hidden
        >
          {item.icon}
        </span>
        <span className="truncate px-0.5">{item.label}</span>
      </a>
    </li>
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
