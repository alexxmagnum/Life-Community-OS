"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { ZoomableImage } from "../media/MediaLightbox";

/** Symbolic place band — identity strip, not a presentation hero. */
export type TerritoryHeroProps = {
  imageUrl: string;
  /** Soft caption over the photo */
  caption?: string;
  /** band = flat symbolic strip (Home default); stage = tall presentation */
  variant?: "band" | "stage";
  className?: string;
  brandName?: string;
  greeting?: string;
  callout?: string;
  areaLabel?: string;
  territoryName?: string;
  weatherLabel?: string;
  onNotifications?: () => void;
  notificationCount?: number;
};

export function TerritoryHero({
  imageUrl,
  caption,
  variant = "band",
  className,
}: TerritoryHeroProps) {
  const isBand = variant === "band";

  return (
    <section className={cn("relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--color-surface-muted)]",
          isBand
            ? "h-[72px] rounded-[16px] sm:h-[80px]"
            : "h-[min(42vh,340px)] rounded-[26px]",
        )}
      >
        <ZoomableImage
          src={imageUrl}
          alt=""
          className={cn(
            isBand ? "object-[center_40%]" : "object-[center_45%]",
          )}
          wrapperClassName="absolute inset-0 h-full w-full"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isBand
              ? "linear-gradient(90deg, rgba(20,28,24,0.55) 0%, rgba(20,28,24,0.15) 55%, transparent 100%)"
              : "linear-gradient(180deg, rgba(20,28,24,0.04) 0%, transparent 45%, rgba(20,28,24,0.58) 100%)",
          }}
        />
        {caption ? (
          <p
            className={cn(
              "pointer-events-none absolute font-display font-medium italic text-white drop-shadow-sm",
              isBand
                ? "bottom-0 left-0 max-w-[22ch] px-3.5 pb-2.5 text-[15px] leading-5"
                : "bottom-0 left-0 flex max-w-[17ch] items-end gap-1.5 px-5 pb-5 text-[22px] leading-[1.2] sm:text-[24px]",
            )}
          >
            <span>{caption}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

export type QuickActionBarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  hint?: string;
  onClick: () => void;
};

export type QuickActionBarProps = {
  items: QuickActionBarItem[];
  className?: string;
};

/** Soft entry strip — air and line icons, not module tiles. */
export function QuickActionBar({ items, className }: QuickActionBarProps) {
  if (items.length === 0) return null;
  const visible = items.slice(0, 5);
  return (
    <div
      className={cn(
        "grid gap-2",
        visible.length >= 4 ? "grid-cols-4" : "grid-cols-3",
        className,
      )}
    >
      {visible.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-[16px] bg-white px-1 py-2.5 text-[var(--color-action-primary)] shadow-[0_1px_2px_rgba(26,31,28,0.04)] transition-transform active:scale-[0.97]"
        >
          <span className="flex h-8 w-8 items-center justify-center" aria-hidden>
            {item.icon}
          </span>
          <span className="w-full text-center">
            <span className="block text-[11px] font-bold leading-4 tracking-tight">
              {item.label}
            </span>
            {item.hint ? (
              <span className="mt-0.5 block px-0.5 text-[9px] font-medium leading-[1.2] text-[var(--color-text-tertiary)]">
                {item.hint}
              </span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

export type GlobalAppSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  kindLabel: string;
  href: string;
  imageUrl?: string;
};

export type GlobalAppSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hits?: GlobalAppSearchHit[];
  onSelectHit?: (hit: GlobalAppSearchHit) => void;
  suggestions?: { id: string; label: string; onClick: () => void }[];
  className?: string;
};

/** Whole-app search entry — primary interactive control under chrome. */
export function GlobalAppSearch({
  value,
  onChange,
  placeholder = "Buscar en toda la app…",
  hits = [],
  onSelectHit,
  suggestions = [],
  className,
}: GlobalAppSearchProps) {
  const open = value.trim().length >= 2;

  return (
    <div className={cn("relative", className)}>
      <label className="relative block">
        <span className="sr-only">Buscar</span>
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-action-primary)]"
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-h-[52px] w-full rounded-[16px] border border-[var(--color-border-subtle)] bg-white py-3 pl-11 pr-10 text-[15px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] shadow-[0_1px_3px_rgba(26,31,28,0.05)] focus:border-[var(--color-action-primary)] focus:ring-2 focus:ring-[var(--color-action-primary-subtle)]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[var(--color-text-tertiary)]"
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        ) : null}
      </label>

      {!open && suggestions.length > 0 ? (
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {suggestions.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onClick}
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--color-action-primary)] shadow-[0_1px_2px_rgba(26,31,28,0.05)] active:scale-[0.98]"
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[18px] bg-white shadow-[0_12px_40px_rgba(26,31,28,0.14)]">
          {hits.length === 0 ? (
            <p className="px-4 py-5 text-[14px] text-[var(--color-text-secondary)]">
              Sin resultados para “{value.trim()}”
            </p>
          ) : (
            <ul className="max-h-[min(50vh,320px)] overflow-y-auto py-1">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    onClick={() => onSelectHit?.(hit)}
                    className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-[var(--color-surface-muted)]"
                  >
                    {hit.imageUrl ? (
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-muted)]">
                        <ZoomableImage
                          src={hit.imageUrl}
                          alt=""
                          wrapperClassName="h-full w-full"
                        />
                      </span>
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-action-primary-subtle)] text-[11px] font-bold text-[var(--color-action-primary)]">
                        {hit.kindLabel.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold text-[var(--color-action-primary)]">
                        {hit.kindLabel}
                      </span>
                      <span className="mt-0.5 block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                        {hit.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[var(--color-text-tertiary)]">
                        {hit.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export type CommunityPulseMomentProps = {
  title: string;
  livingLine?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  emptyLabel?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  /** stack = narrative moments; rail = soft time pills */
  layout?: "stack" | "rail";
  className?: string;
};

/** Living community magazine — editorial pulse, not an admin list. */
export function CommunityPulseMoment({
  title,
  livingLine,
  actionLabel,
  onAction,
  children,
  emptyLabel,
  onEmptyAction,
  emptyActionLabel = "Descubrir",
  layout = "stack",
  className,
}: CommunityPulseMomentProps) {
  const hasChildren = Boolean(children);
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-semibold leading-7 tracking-tight text-[var(--color-text-primary)] sm:text-[24px]">
            {title}
          </h2>
          {livingLine ? (
            <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-tertiary)]">
              {livingLine}
            </p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-[13px] font-semibold text-[var(--color-action-primary)]"
          >
            {actionLabel} ›
          </button>
        ) : null}
      </div>
      {hasChildren ? (
        layout === "rail" ? (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {children}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]/90">{children}</div>
        )
      ) : (
        <div className="rounded-[24px] bg-[var(--color-surface-muted)]/50 px-5 py-10 text-center">
          <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
            {emptyLabel}
          </p>
          {onEmptyAction ? (
            <button
              type="button"
              onClick={onEmptyAction}
              className="mt-4 text-[15px] font-semibold text-[var(--color-action-primary)]"
            >
              {emptyActionLabel}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

export type CommunityActivityCardProps = {
  headline: string;
  context?: string;
  categoryLabel?: string;
  timeLabel?: string;
  actionLabel?: string;
  imageUrl?: string;
  personName?: string;
  personAvatarUrl?: string;
  live?: boolean;
  /** featured = photo-led moment; compact = quieter magazine row */
  variant?: "featured" | "compact";
  onClick?: () => void;
  onAction?: () => void;
  className?: string;
};

function categoryAccent(label?: string): string {
  const key = (label ?? "").toLowerCase();
  if (key.includes("aviso")) return "text-[#3D6B7A]";
  if (key.includes("activ") || key.includes("plan")) return "text-[#2F6F4E]";
  if (key.includes("deport") || key.includes("espacio")) return "text-[#5B4B8A]";
  if (key.includes("mercado")) return "text-[#C47A3A]";
  if (key.includes("consejo") || key.includes("recom")) return "text-[#9A7A18]";
  if (key.includes("cerca") || key.includes("grupo")) return "text-[#C47A3A]";
  return "text-[var(--color-action-primary)]";
}

function CategoryGlyph({ label }: { label?: string }) {
  const key = (label ?? "").toLowerCase();
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true as const,
  };
  if (key.includes("aviso")) {
    return (
      <svg {...common}>
        <path d="M12 4v12M12 19.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("activ") || key.includes("plan")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (key.includes("deport")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 4.5v15M4.5 12h15" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (key.includes("mercado")) {
    return (
      <svg {...common}>
        <path d="M7 7h13l-1.4 8.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.7L6 4H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (key.includes("consejo") || key.includes("recom")) {
    return (
      <svg {...common}>
        <path d="m12 3 2.1 6.3H21l-5.4 3.9 2.1 6.3L12 15.8 6.3 19.5l2.1-6.3L3 9.3h6.9L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * Editorial community moment — magazine row with featured / compact rhythm.
 */
export function CommunityActivityCard({
  headline,
  context,
  categoryLabel,
  timeLabel,
  actionLabel,
  imageUrl,
  personName,
  personAvatarUrl,
  live,
  variant = "compact",
  onClick,
  onAction,
  className,
}: CommunityActivityCardProps) {
  const featured = variant === "featured";

  if (featured && imageUrl) {
    return (
      <article className={cn("py-5", className)}>
        <button
          type="button"
          onClick={onClick}
          className="group w-full overflow-hidden rounded-[22px] text-left"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-muted)]">
            <ZoomableImage
              src={imageUrl}
              alt=""
              className="transition-transform duration-700 group-active:scale-[1.02]"
              wrapperClassName="h-full w-full"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(transparent 40%, rgba(20,28,24,0.72))",
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
              {categoryLabel ? (
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/85">
                  {categoryLabel}
                  {live ? " · Ahora" : ""}
                </span>
              ) : null}
              <span className="mt-1 block font-display text-[22px] font-semibold leading-6 text-white">
                {headline}
              </span>
              {context ? (
                <span className="mt-1 block text-[13px] text-white/80">
                  {context}
                </span>
              ) : null}
            </div>
          </div>
        </button>
        <div className="mt-3 flex items-center justify-between gap-3 px-0.5">
          <span className="flex min-w-0 items-center gap-2">
            {personAvatarUrl ? (
              <ZoomableImage
                src={personAvatarUrl}
                alt={personName ?? ""}
                className="rounded-full"
                wrapperClassName="h-6 w-6 shrink-0 rounded-full"
              />
            ) : null}
            {personName ? (
              <span className="truncate text-[13px] text-[var(--color-text-secondary)]">
                {personName}
              </span>
            ) : null}
          </span>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="shrink-0 text-[13px] font-semibold text-[var(--color-action-primary)]"
            >
              {actionLabel} ›
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className={cn(featured ? "py-4" : "py-3.5", className)}>
      <div className="flex items-start gap-3">
        {!imageUrl ? (
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white",
              categoryAccent(categoryLabel),
            )}
            aria-hidden
          >
            <CategoryGlyph label={categoryLabel} />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <button type="button" onClick={onClick} className="w-full text-left">
            <span className="flex flex-wrap items-center gap-2">
              {categoryLabel ? (
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-[0.04em]",
                    categoryAccent(categoryLabel),
                  )}
                >
                  {categoryLabel}
                </span>
              ) : null}
              {live ? (
                <span className="text-[11px] font-semibold text-[var(--color-action-accent)]">
                  Ahora
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "mt-1 block font-semibold leading-5 text-[var(--color-text-primary)]",
                featured ? "text-[17px]" : "text-[15px]",
              )}
            >
              {headline}
            </span>
            {context ? (
              <span className="mt-1 block line-clamp-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
                {context}
              </span>
            ) : null}
            {(personName || timeLabel) && (
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                {personAvatarUrl ? (
                  <ZoomableImage
                    src={personAvatarUrl}
                    alt={personName ?? ""}
                    className="rounded-full"
                    wrapperClassName="h-5 w-5 shrink-0 rounded-full"
                  />
                ) : null}
                {personName ? (
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">
                    {personName}
                  </span>
                ) : null}
                {timeLabel ? (
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">
                    {timeLabel}
                  </span>
                ) : null}
              </span>
            )}
          </button>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-1.5 text-[13px] font-semibold text-[var(--color-action-primary)]"
            >
              {actionLabel} ›
            </button>
          ) : null}
        </div>

        {imageUrl ? (
          <span
            className={cn(
              "relative shrink-0 overflow-hidden rounded-[14px] bg-[var(--color-surface-muted)]",
              featured ? "h-20 w-20" : "h-14 w-14",
            )}
          >
            <ZoomableImage
              src={imageUrl}
              alt={headline}
              wrapperClassName="h-full w-full"
            />
          </span>
        ) : null}
      </div>
    </article>
  );
}

export type CommunityPulseCardProps = {
  time: string;
  title: string;
  meta: string;
  live?: boolean;
  onClick?: () => void;
  className?: string;
  /** @deprecated unused — kept for type compatibility during redesign */
  eyebrow?: string;
  imageUrl?: string;
  tone?: "experience" | "official" | "neighbour" | "place" | "activity";
};

/** Soft agenda pill — time-led, not a mini card grid. */
export function CommunityPulseCard({
  time,
  title,
  meta,
  live,
  onClick,
  className,
}: CommunityPulseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[88px] min-w-[200px] max-w-[240px] shrink-0 flex-col justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.98]",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <span className="text-[14px] font-semibold text-[var(--color-action-primary)]">
          {time}
        </span>
        {live ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-action-accent)]"
            aria-label="En breve"
          />
        ) : null}
      </span>
      <span className="mt-2 line-clamp-2 text-[17px] font-semibold leading-5 text-[var(--color-text-primary)]">
        {title}
      </span>
      <span className="mt-1.5 line-clamp-1 text-[14px] text-[var(--color-text-tertiary)]">
        {meta}
      </span>
    </button>
  );
}

/** @deprecated Prefer QuickActionBar — kept for export stability. */
export type ParticipationInvitationCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  onClick?: () => void;
  className?: string;
};

export function ParticipationInvitationCard({
  title,
  description,
  ctaLabel,
  onClick,
  className,
}: ParticipationInvitationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[var(--radius-xl)] bg-[var(--color-action-primary-subtle)] px-5 py-6 text-left transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <span className="block font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8 text-[var(--color-action-primary)]">
        {title}
      </span>
      <span className="mt-2 block text-[16px] leading-6 text-[var(--color-text-secondary)]">
        {description}
      </span>
      <span className="mt-5 inline-flex min-h-[48px] items-center text-[16px] font-semibold text-[var(--color-action-primary)]">
        {ctaLabel} →
      </span>
    </button>
  );
}

export type OfficialNoticeCardProps = {
  title: string;
  preview: string;
  areaLabel?: string;
  imageUrl?: string;
  badgeLabel?: string;
  onClick?: () => void;
  className?: string;
};

/** Editorial official voice — one calm story, not a feed item. */
export function OfficialNoticeCard({
  title,
  preview,
  areaLabel,
  imageUrl,
  badgeLabel = "Oficial",
  onClick,
  className,
}: OfficialNoticeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group w-full text-left", className)}
    >
      {imageUrl ? (
        <div className="aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
          <ZoomableImage
            src={imageUrl}
            alt=""
            className="transition-transform duration-500 group-active:scale-[1.02]"
            wrapperClassName="h-full w-full"
          />
        </div>
      ) : null}
      <div className={cn(imageUrl ? "mt-4" : "", "pl-4 border-l-[3px] border-[var(--color-accent-official)]")}>
        <p className="text-[13px] font-semibold tracking-wide text-[var(--color-accent-official)]">
          {badgeLabel}
          {areaLabel ? ` · ${areaLabel}` : ""}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {preview}
        </p>
      </div>
    </button>
  );
}

export type CommunityStoryProps = {
  eyebrow: string;
  title: string;
  body: string;
  meta?: string;
  imageUrl?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  onClick?: () => void;
  className?: string;
};

/** Human community story — people and place, not a social card. */
export function CommunityStory({
  eyebrow,
  title,
  body,
  meta,
  imageUrl,
  authorName,
  authorAvatarUrl,
  onClick,
  className,
}: CommunityStoryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-full text-left", className)}
    >
      {imageUrl ? (
        <div className="aspect-[5/4] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]">
          <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        </div>
      ) : null}
      <div className={imageUrl ? "mt-4" : ""}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-accent-community)]">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[16px] leading-6 text-[var(--color-text-secondary)]">
          {body}
        </p>
        {(authorName || meta) && (
          <div className="mt-4 flex items-center gap-3">
            {authorAvatarUrl ? (
              <ZoomableImage
                src={authorAvatarUrl}
                alt={authorName ?? ""}
                className="rounded-full"
                wrapperClassName="h-9 w-9 shrink-0 rounded-full"
              />
            ) : null}
            <div>
              {authorName ? (
                <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {authorName}
                </p>
              ) : null}
              {meta ? (
                <p className="text-[13px] text-[var(--color-text-tertiary)]">
                  {meta}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export type ExperiencePreviewCardProps = {
  title: string;
  when: string;
  where: string;
  imageUrl: string;
  peopleLabel?: string;
  categoryLabel?: string;
  ctaLabel?: string;
  onClick?: () => void;
  onCta?: () => void;
  className?: string;
};

/** Photo-led experience — large vertical card for discovery rails. */
export function ExperiencePreviewCard({
  title,
  when,
  where,
  imageUrl,
  peopleLabel,
  categoryLabel,
  ctaLabel = "Unirme",
  onClick,
  onCta,
  className,
}: ExperiencePreviewCardProps) {
  return (
    <article className={cn("relative", className)}>
      <button
        type="button"
        className="group relative block w-full overflow-hidden rounded-[24px] text-left shadow-[0_8px_24px_rgba(26,31,28,0.08)]"
        onClick={onClick}
      >
        <div className="aspect-[3/4] bg-[var(--color-surface-muted)]">
          <ZoomableImage
            src={imageUrl}
            alt=""
            className="transition-transform duration-700 group-active:scale-[1.03]"
            wrapperClassName="h-full w-full"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4"
          style={{
            background:
              "linear-gradient(transparent 38%, rgba(20,28,24,0.78))",
          }}
        >
          {categoryLabel ? (
            <span className="mb-2 inline-flex w-fit rounded-md bg-[var(--color-action-primary)]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-inverse)]">
              {categoryLabel}
            </span>
          ) : null}
          <h3 className="font-display text-[22px] font-semibold leading-6 text-[var(--color-text-inverse)]">
            {title}
          </h3>
          <p className="mt-1.5 text-[13px] text-[var(--color-text-inverse)]/90">
            {when}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-inverse)]/75">
            {where}
            {peopleLabel ? ` · ${peopleLabel}` : ""}
          </p>
        </div>
      </button>
      {onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[15px] font-semibold text-[var(--color-text-inverse)]"
        >
          {ctaLabel}
        </button>
      ) : null}
    </article>
  );
}

export type PlacePreviewCardProps = {
  name: string;
  availability: string;
  areaLabel?: string;
  imageUrl: string;
  onClick?: () => void;
  className?: string;
};

/** Visual place tease — curiosity over catalog. */
export function PlacePreviewCard({
  name,
  availability,
  areaLabel,
  imageUrl,
  onClick,
  className,
}: PlacePreviewCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative min-w-[72vw] max-w-[280px] shrink-0 overflow-hidden rounded-[var(--radius-xl)] text-left sm:min-w-[240px]",
        className,
      )}
    >
      <div className="aspect-[3/4] bg-[var(--color-surface-muted)]">
        <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4"
        style={{
          background:
            "linear-gradient(transparent 45%, rgba(20,28,24,0.7))",
        }}
      >
        <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-6 text-[var(--color-text-inverse)]">
          {name}
        </span>
        <span className="mt-1.5 text-[13px] text-[var(--color-text-inverse)]/85">
          Libre · {availability}
          {areaLabel ? ` · ${areaLabel}` : ""}
        </span>
      </div>
    </button>
  );
}

export type HomeSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
};

export function HomeSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  className,
}: HomeSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-semibold leading-7 tracking-tight text-[var(--color-text-primary)] sm:text-[24px]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-[14px] leading-5 text-[var(--color-text-tertiary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-[13px] font-semibold text-[var(--color-action-primary)]"
          >
            {actionLabel} ›
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
