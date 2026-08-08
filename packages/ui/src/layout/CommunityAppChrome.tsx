"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { useMediaLightbox, ZoomableImage } from "../media/MediaLightbox";

/**
 * Persistent mobile app chrome — private club entrance, not a data bar.
 * Identity comes from tenant props only.
 */
export type CommunityAppHeaderProps = {
  brandName: string;
  territoryName?: string;
  areaLabel: string;
  weatherLabel?: string;
  notificationCount?: number;
  onNotifications?: () => void;
  profileImageUrl?: string;
  profileName?: string;
  onProfileClick?: () => void;
  className?: string;
};

export function CommunityAppHeader({
  brandName,
  territoryName,
  areaLabel,
  weatherLabel,
  notificationCount = 0,
  onNotifications,
  profileImageUrl,
  profileName,
  onProfileClick,
  className,
}: CommunityAppHeaderProps) {
  const lightbox = useMediaLightbox();
  // Place once: area is enough in chrome; territory lives in Home copy.
  const placeLabel = areaLabel || territoryName;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 bg-[var(--color-surface-app)]/95 backdrop-blur-xl md:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[390px] items-center gap-2 px-4 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <p className="font-display max-w-[7.5rem] shrink-0 text-[13px] font-semibold leading-[1.15] tracking-tight text-[var(--color-action-primary)]">
          {brandName}
        </p>

        {placeLabel ? (
          <span className="inline-flex min-w-0 flex-1 items-center gap-1 rounded-full bg-white px-2.5 py-1.5 shadow-[0_1px_2px_rgba(26,31,28,0.05)]">
            <span className="shrink-0 text-[11px] text-[var(--color-action-primary)]" aria-hidden>
              ⌖
            </span>
            <span className="truncate text-[11px] font-bold text-[var(--color-text-primary)]">
              {placeLabel}
            </span>
          </span>
        ) : (
          <span className="flex-1" />
        )}

        {weatherLabel ? (
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            {weatherLabel}
          </span>
        ) : null}

        {onNotifications ? (
          <button
            type="button"
            onClick={onNotifications}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-text-primary)] shadow-[0_1px_2px_rgba(26,31,28,0.05)]"
            aria-label="Notificaciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 19a2 2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {notificationCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-action-primary)] px-1 text-[9px] font-bold text-white ring-2 ring-[var(--color-surface-app)]">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </button>
        ) : null}

        {onProfileClick || profileImageUrl ? (
          <button
            type="button"
            onClick={() => {
              if (profileImageUrl && lightbox) {
                lightbox.open(profileImageUrl, profileName ?? "");
                return;
              }
              onProfileClick?.();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-action-primary-subtle)] ring-1 ring-[var(--color-border-subtle)]"
            aria-label={
              profileImageUrl
                ? `Ampliar foto${profileName ? ` de ${profileName}` : ""}`
                : "Perfil"
            }
          >
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[12px] font-semibold text-[var(--color-action-primary)]">
                {(profileName ?? "?").slice(0, 1)}
              </span>
            )}
          </button>
        ) : null}
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

export type AppMenuSheetProps = {
  open: boolean;
  onClose: () => void;
  brandName: string;
  areaLabel: string;
  items: AppMenuItem[];
  title?: string;
};

/** Utility menu — not a second navigation system. */
export function AppMenuSheet({
  open,
  onClose,
  brandName,
  areaLabel,
  items,
  title = "Menú",
}: AppMenuSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-md rounded-t-[var(--radius-xl)] bg-[var(--color-surface-elevated)] px-4 pb-8 pt-3 shadow-[var(--shadow-elev-2)] md:rounded-[var(--radius-xl)] md:pb-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border-strong)] md:hidden" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
          {brandName}
        </p>
        <h2 className="mt-1 text-[22px] font-semibold text-[var(--color-text-primary)]">
          {areaLabel}
        </h2>
        <ul className="mt-5 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex min-h-[52px] w-full flex-col justify-center rounded-[var(--radius-md)] px-2 py-3 text-left transition-colors active:bg-[var(--color-surface-muted)]"
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
              >
                <span className="text-[17px] font-semibold text-[var(--color-text-primary)]">
                  {item.label}
                </span>
                {item.description ? (
                  <span className="mt-0.5 text-[14px] text-[var(--color-text-secondary)]">
                    {item.description}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
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
