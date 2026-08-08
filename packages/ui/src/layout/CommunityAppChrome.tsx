"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { ZoomableImage } from "../media/MediaLightbox";

/**
 * Global mobile app header — outside the hero.
 * Identity only: brand · notifications · menu.
 * Territory / weather belong in the belonging hero (Home), not here.
 */
export type CommunityAppHeaderProps = {
  brandName: string;
  onBrandClick?: () => void;
  brandLabel?: string;
  onMenuOpen?: () => void;
  menuLabel?: string;
  notificationCount?: number;
  onNotifications?: () => void;
  notificationsLabel?: string;
  className?: string;
  /** @deprecated Avatar removed from header — ignored */
  profileImageUrl?: string;
  /** @deprecated Avatar removed from header — ignored */
  profileName?: string;
  /** @deprecated Avatar removed from header — ignored */
  onProfileClick?: () => void;
  /** @deprecated Avatar removed from header — ignored */
  profileLabel?: string;
  /** @deprecated Place context moved to TerritoryHero — ignored */
  territoryName?: string;
  /** @deprecated Place context moved to TerritoryHero — ignored */
  areaLabel?: string;
  /** @deprecated Weather moved to TerritoryHero — ignored */
  weatherLabel?: string;
};

export function CommunityAppHeader({
  brandName,
  onBrandClick,
  brandLabel = "Ir al inicio",
  onMenuOpen,
  menuLabel = "Menú",
  notificationCount = 0,
  onNotifications,
  notificationsLabel = "Notificaciones",
  className,
}: CommunityAppHeaderProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 bg-white md:hidden",
        className,
      )}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-[52px] max-w-[390px] items-center gap-2 px-3">
          {onBrandClick ? (
            <button
              type="button"
              onClick={onBrandClick}
              className="relative z-10 min-w-0 flex-1 truncate text-left font-[family-name:var(--font-brand)] text-[21px] font-semibold leading-none tracking-[-0.01em] text-[var(--color-action-primary)] active:opacity-80"
              aria-label={brandLabel}
            >
              {brandName}
            </button>
          ) : (
            <p className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-brand)] text-[21px] font-semibold leading-none tracking-[-0.01em] text-[var(--color-action-primary)]">
              {brandName}
            </p>
          )}

          <div className="relative z-10 flex shrink-0 items-center gap-0.5">
            {onNotifications ? (
              <button
                type="button"
                onClick={onNotifications}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors active:bg-black/[0.04]"
                aria-label={notificationsLabel}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7"
                    stroke="currentColor"
                    strokeWidth="1.55"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 19a2 2 0 0 0 4 0"
                    stroke="currentColor"
                    strokeWidth="1.55"
                    strokeLinecap="round"
                  />
                </svg>
                {notificationCount > 0 ? (
                  <span className="absolute right-0 top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#E53935] px-1 text-[9px] font-bold leading-none text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {onMenuOpen ? (
              <button
                type="button"
                onClick={onMenuOpen}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors active:bg-black/[0.04]"
                aria-label={menuLabel}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export type AppMenuItem = {
  id: string;
  label: string;
  description?: string;
  onSelect: () => void;
};

export type AppMenuLeafIcon =
  | "info"
  | "pin"
  | "people"
  | "family"
  | "help"
  | "proposal"
  | "padel"
  | "tennis"
  | "golf"
  | "hike"
  | "class"
  | "games"
  | "trophy"
  | "cart"
  | "handshake"
  | "briefcase"
  | "car"
  | "restaurant"
  | "shop"
  | "pharmacy"
  | "service"
  | "place"
  | "calendar"
  | "child"
  | "sport"
  | "culture"
  | "party"
  | "admin"
  | "city"
  | "security"
  | "works"
  | "public";

/** Leaf destination inside a Community Explorer category. */
export type AppMenuLeaf = {
  id: string;
  label: string;
  icon?: AppMenuLeafIcon;
  onSelect: () => void;
};

export type AppMenuCategoryTone =
  | "community"
  | "activities"
  | "exchange"
  | "local"
  | "events"
  | "official";

/** Expandable category in the Community Explorer drawer. */
export type AppMenuCategory = {
  id: string;
  label: string;
  description: string;
  tone: AppMenuCategoryTone;
  /** Optional glyph inside the tone tile */
  glyph?: string;
  children: AppMenuLeaf[];
};

export type AppMenuSheetProps = {
  open: boolean;
  onClose: () => void;
  brandName: string;
  /** Hierarchical explorer sections (preferred). */
  categories?: AppMenuCategory[];
  /**
   * @deprecated Flat list — use `categories` for the Community Explorer.
   */
  items?: AppMenuItem[];
  searchPlaceholder?: string;
  closeLabel?: string;
  /** Pinned footer action — e.g. Mi perfil */
  profileLabel?: string;
  onProfileSelect?: () => void;
  /** @deprecated Explorer uses brand + search — area line removed from chrome */
  areaLabel?: string;
  title?: string;
};

const TONE_TILE: Record<AppMenuCategoryTone, string> = {
  community: "bg-[#E7F0EC] text-[#1F4A3C]",
  activities: "bg-[#E8F1F4] text-[#3D6B7A]",
  exchange: "bg-[#F8EFE6] text-[#C47A3A]",
  local: "bg-[#EFE8F4] text-[#6B4F8A]",
  events: "bg-[#FBF3DC] text-[#B8860B]",
  official: "bg-[#E8EAF4] text-[#3A4570]",
};

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <circle cx="16" cy="11" r="4.2" fill="currentColor" opacity="0.9" />
      <path
        d="M4 22c3.5-4 7-6 12-6s8.5 2 12 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 25c2.8-2.2 6-3.2 10-3.2S23.2 22.8 26 25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M8 18.5c1.2-1.6 2.8-2.5 4.6-2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/** Flat category glyphs matching the Community Explorer mock. */
function CategoryGlyph({ tone }: { tone: AppMenuCategoryTone }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true,
  };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (tone) {
    case "community":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 5l8 6.5" {...stroke} />
          <path d="M7 10.5V19h10v-8.5" {...stroke} />
          <path d="M10 19v-4h4v4" {...stroke} />
        </svg>
      );
    case "activities":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="4.5" {...stroke} />
          <path d="M12.2 12.2 19 19" {...stroke} />
          <path d="M15.5 15.5c.8.3 1.8.2 2.6-.4" {...stroke} />
          <path d="M7.2 7.2c1.2 1.5 3.2 2.6 5 3" {...stroke} opacity={0.55} />
        </svg>
      );
    case "exchange":
      return (
        <svg {...common}>
          <path
            d="M8.5 13.5 6 11a2.2 2.2 0 0 1 0-3.1L8.5 5.4 11 7.9l2.5-2.5L16 7.9a2.2 2.2 0 0 1 0 3.1L13.5 13.5"
            {...stroke}
          />
          <path d="m10 15.5 2 2 2-2" {...stroke} />
          <path d="M8 17.5h8" {...stroke} opacity={0.45} />
        </svg>
      );
    case "local":
      return (
        <svg {...common}>
          <path d="M4 10h16l-1.2 10H5.2L4 10Z" {...stroke} />
          <path d="M8 10V8a4 4 0 0 1 8 0v2" {...stroke} />
          <path d="M10 14h4" {...stroke} />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="14" rx="2.2" {...stroke} />
          <path d="M8 4v4M16 4v4M4 11h16" {...stroke} />
          <path d="M8 15h3M13 15h3" {...stroke} opacity={0.55} />
        </svg>
      );
    case "official":
      return (
        <svg {...common}>
          <path d="M4 20h16" {...stroke} />
          <path d="M6 20V10l6-5 6 5v10" {...stroke} />
          <path d="M9 20v-5h6v5" {...stroke} />
          <path d="M9 12h.01M12 12h.01M15 12h.01" {...stroke} />
        </svg>
      );
  }
}

function LeafIcon({ kind }: { kind?: AppMenuLeafIcon }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true,
  };
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (kind) {
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" {...stroke} />
          <circle cx="12" cy="11" r="2" {...stroke} />
        </svg>
      );
    case "people":
    case "family":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" {...stroke} />
          <circle cx="16" cy="10" r="2.4" {...stroke} />
          <path d="M3.5 19c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4" {...stroke} />
          <path d="M14 15.5c1.3-.4 2.7-.2 4 .8" {...stroke} />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M9.8 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.2.9-1.2 1.7" {...stroke} />
          <path d="M12 16.5h.01" {...stroke} />
        </svg>
      );
    case "proposal":
      return (
        <svg {...common}>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" {...stroke} />
        </svg>
      );
    case "padel":
    case "tennis":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" {...stroke} />
          <path d="M8 8c2 3 6 5 8 8" {...stroke} />
        </svg>
      );
    case "golf":
      return (
        <svg {...common}>
          <path d="M8 21V8l9-3v3" {...stroke} />
          <circle cx="8" cy="21" r="1.5" fill="currentColor" />
        </svg>
      );
    case "hike":
      return (
        <svg {...common}>
          <path d="m4 18 5-8 3 4 3-5 5 9" {...stroke} />
        </svg>
      );
    case "class":
      return (
        <svg {...common}>
          <path d="M4 19V7l8-3 8 3v12" {...stroke} />
          <path d="M12 4v15" {...stroke} />
        </svg>
      );
    case "games":
      return (
        <svg {...common}>
          <rect x="4" y="7" width="16" height="12" rx="2" {...stroke} />
          <path d="M9 13h.01M15 13h.01M12 11v4" {...stroke} />
        </svg>
      );
    case "trophy":
    case "sport":
      return (
        <svg {...common}>
          <path d="M8 5h8v3a4 4 0 0 1-8 0V5Z" {...stroke} />
          <path d="M8 5H5.5A2.5 2.5 0 0 0 8 8.5M16 5h2.5A2.5 2.5 0 0 1 16 8.5" {...stroke} />
          <path d="M12 12v4M9 21h6M12 16h0" {...stroke} />
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <path d="M4 5h2l2.2 10h9.3L20 8H8" {...stroke} />
          <circle cx="10" cy="19" r="1.2" fill="currentColor" />
          <circle cx="17" cy="19" r="1.2" fill="currentColor" />
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <path d="M8 13 5.5 10.5a2 2 0 0 1 0-2.8L8 5l3 3 3-3 2.5 2.5a2 2 0 0 1 0 2.8L14 13" {...stroke} />
          <path d="m10 15 2 2 2-2" {...stroke} />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" {...stroke} />
          <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" {...stroke} />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M4 14h16l-1.5-5.5A2 2 0 0 0 16.6 7H7.4a2 2 0 0 0-1.9 1.5L4 14Z" {...stroke} />
          <path d="M6 17h.01M18 17h.01M4 14v3a1 1 0 0 0 1 1h1M18 18h1a1 1 0 0 0 1-1v-3" {...stroke} />
        </svg>
      );
    case "restaurant":
      return (
        <svg {...common}>
          <path d="M8 4v8M8 12v8M6 4v4a2 2 0 0 0 4 0V4M16 4v16M16 4c2 0 3 2 3 4s-1 4-3 4" {...stroke} />
        </svg>
      );
    case "shop":
      return (
        <svg {...common}>
          <path d="M4 9h16l-1 11H5L4 9Z" {...stroke} />
          <path d="M8 9V7a4 4 0 0 1 8 0v2" {...stroke} />
        </svg>
      );
    case "pharmacy":
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" {...stroke} />
          <path d="M12 8v8M8 12h8" {...stroke} />
        </svg>
      );
    case "service":
    case "public":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" {...stroke} />
        </svg>
      );
    case "place":
      return (
        <svg {...common}>
          <path d="M4 19h16M6 19V9l6-4 6 4v10" {...stroke} />
        </svg>
      );
    case "calendar":
    case "child":
    case "culture":
    case "party":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="14" rx="2" {...stroke} />
          <path d="M8 3v4M16 3v4M4 11h16" {...stroke} />
        </svg>
      );
    case "admin":
    case "city":
      return (
        <svg {...common}>
          <path d="M4 20V9l8-5 8 5v11" {...stroke} />
          <path d="M9 20v-5h6v5" {...stroke} />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z" {...stroke} />
        </svg>
      );
    case "works":
      return (
        <svg {...common}>
          <path d="M14.5 6.5 18 3l3 3-3.5 3.5M3 21l7.5-7.5" {...stroke} />
          <path d="m11 8 5 5" {...stroke} />
        </svg>
      );
    case "info":
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <path d="M12 11v5M12 8h.01" {...stroke} />
        </svg>
      );
  }
}

/**
 * Life Panoramica Community Explorer — floating left drawer.
 * Matches the product mock: brand mark, search, expandable categories.
 */
export function AppMenuSheet({
  open,
  onClose,
  brandName,
  categories,
  items,
  searchPlaceholder = "Buscar en Life Panoramica",
  closeLabel = "Cerrar",
  profileLabel = "Mi perfil",
  onProfileSelect,
}: AppMenuSheetProps) {
  const [entered, setEntered] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const sections = useMemo((): AppMenuCategory[] => {
    if (categories && categories.length > 0) return categories;
    if (!items?.length) return [];
    return [
      {
        id: "legacy",
        label: "Explorar",
        description: "",
        tone: "community",
        children: items.map((item) => ({
          id: item.id,
          label: item.label,
          onSelect: item.onSelect,
        })),
      },
    ];
  }, [categories, items]);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setQuery("");
      return;
    }
    // Always open with every category collapsed.
    const defaults: Record<string, boolean> = {};
    for (const section of sections) defaults[section.id] = false;
    setExpanded(defaults);
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, [open, sections]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => {
        const children = section.children.filter((leaf) =>
          leaf.label.toLowerCase().includes(q),
        );
        const matchSection =
          section.label.toLowerCase().includes(q) ||
          section.description.toLowerCase().includes(q);
        if (matchSection) return section;
        if (children.length === 0) return null;
        return { ...section, children };
      })
      .filter(Boolean) as AppMenuCategory[];
  }, [query, sections]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          entered ? "opacity-100" : "opacity-0",
        )}
        aria-label={closeLabel}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={brandName}
        className={cn(
          "absolute left-[3%] top-[4%] z-10 flex h-[92vh] w-[min(84vw,22.5rem)] flex-col overflow-hidden rounded-[1.5rem] bg-[#F7F4EF] shadow-[0_18px_50px_rgba(26,31,28,0.22)] transition-transform duration-300 ease-out",
          entered ? "translate-x-0" : "-translate-x-[112%]",
        )}
      >
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 text-[var(--color-action-primary)]">
              <BrandMark />
              <p className="truncate font-[family-name:var(--font-brand)] text-[18px] font-semibold tracking-tight">
                {brandName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors active:bg-black/5"
              aria-label={closeLabel}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <label className="mt-4 flex min-h-[44px] items-center gap-2.5 rounded-full bg-white px-3.5 shadow-[0_1px_2px_rgba(26,31,28,0.06)] ring-1 ring-[var(--color-border-subtle)]">
            <span className="text-[var(--color-text-tertiary)]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="m16 16 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
          </label>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          <ul className="space-y-0.5">
            {filtered.map((category) => {
              const isOpen = expanded[category.id] ?? false;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [category.id]: !isOpen,
                      }))
                    }
                    className="flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition-colors active:bg-black/[0.03]"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]",
                        TONE_TILE[category.tone],
                      )}
                      aria-hidden
                    >
                      {category.glyph ? (
                        <span className="text-[18px] leading-none">
                          {category.glyph}
                        </span>
                      ) : (
                        <CategoryGlyph tone={category.tone} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
                        {category.label}
                      </span>
                      {category.description ? (
                        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--color-text-tertiary)]">
                          {category.description}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="m6 9 6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <ul className="min-h-0 overflow-hidden pb-1">
                      {category.children.map((leaf) => (
                        <li key={leaf.id}>
                          <button
                            type="button"
                            className="flex min-h-[42px] w-full items-center gap-3 rounded-[12px] py-1.5 pl-[3.65rem] pr-3 text-left text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors active:bg-black/[0.03] active:text-[var(--color-text-primary)]"
                            onClick={() => {
                              leaf.onSelect();
                              onClose();
                            }}
                          >
                            <span className="shrink-0 text-[var(--color-text-tertiary)]">
                              <LeafIcon kind={leaf.icon} />
                            </span>
                            <span>{leaf.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}

            {onProfileSelect ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onProfileSelect();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition-colors active:bg-black/[0.03]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-action-primary-subtle)] text-[var(--color-action-primary)]"
                    aria-hidden
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="9"
                        r="3.25"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M5.5 19.5c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
                      {profileLabel}
                    </span>
                  </span>
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
      </aside>
    </div>
  );
}

export type CategoryFilterOption = {
  value: string;
  label: string;
};

export type CategoryFilterSelectProps = {
  value: string;
  options: CategoryFilterOption[];
  onChange: (value: string) => void;
  className?: string;
  label?: string;
};

export function CategoryFilterSelect({
  value,
  options,
  onChange,
  className,
  label = "Categoría",
}: CategoryFilterSelectProps) {
  return (
    <label className={cn("block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[40px] w-full rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 text-[14px] font-semibold text-[var(--color-text-primary)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export type HomeFeedCardProps = {
  title: string;
  meta?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function HomeFeedCard({
  title,
  meta,
  imageUrl,
  onClick,
  className,
}: HomeFeedCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 py-3 text-left",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
        {meta ? (
          <span className="mt-1 block text-[13px] text-[var(--color-text-secondary)]">
            {meta}
          </span>
        ) : null}
      </span>
      {imageUrl ? (
        <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-surface-muted)]">
          <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        </span>
      ) : null}
    </button>
  );
}

export type SponsoredFeedCardProps = {
  badgeLabel: string;
  title: string;
  authorName?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function SponsoredFeedCard({
  badgeLabel,
  title,
  authorName,
  imageUrl,
  onClick,
  className,
}: SponsoredFeedCardProps) {
  const body = (
    <span className="flex w-full items-center gap-3 py-4 text-left">
      <span className="min-w-0 flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          {badgeLabel}
        </span>
        <span className="mt-1 block text-[15px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        {authorName ? (
          <span className="mt-1 block text-[12px] text-[var(--color-text-tertiary)]">
            {authorName}
          </span>
        ) : null}
      </span>
      {imageUrl ? (
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-surface-muted)]">
          <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        </span>
      ) : null}
    </span>
  );

  const surface = cn(
    "w-full border-b border-[var(--color-border-subtle)]/80 last:border-b-0",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={surface}>
        {body}
      </button>
    );
  }

  return <div className={surface}>{body}</div>;
}

export type HomeFeedSectionProps = {
  title: string;
  filter?: ReactNode;
  children: ReactNode;
  emptyLabel?: string;
};

export function HomeFeedSection({
  title,
  filter,
  children,
  emptyLabel,
}: HomeFeedSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[22px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {filter}
      </div>
      {children ?? (
        <p className="text-[15px] text-[var(--color-text-secondary)]">{emptyLabel}</p>
      )}
    </section>
  );
}
