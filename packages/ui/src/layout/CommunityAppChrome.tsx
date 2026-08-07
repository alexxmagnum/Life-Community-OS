"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/**
 * Persistent mobile app chrome — brand + place belonging.
 * Receives identity as props; never hardcodes a tenant name.
 */
export type CommunityAppHeaderProps = {
  brandName: string;
  areaLabel: string;
  weatherLabel?: string;
  onMenuClick?: () => void;
  className?: string;
};

export function CommunityAppHeader({
  brandName,
  areaLabel,
  weatherLabel,
  onMenuClick,
  className,
}: CommunityAppHeaderProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 backdrop-blur-md md:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[390px] items-center justify-between gap-3 px-4 pb-3 pt-[max(0.65rem,env(safe-area-inset-top))]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
            {brandName}
          </p>
          <p className="mt-0.5 truncate text-[16px] font-semibold leading-5 text-[var(--color-text-primary)]">
            {areaLabel}
          </p>
          {weatherLabel ? (
            <p className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
              {weatherLabel}
            </p>
          ) : null}
        </div>
        {onMenuClick ? (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors active:bg-[var(--color-surface-muted)]"
            aria-label="Menú"
          >
            <span className="flex flex-col gap-[5px]" aria-hidden>
              <span className="block h-[1.5px] w-5 rounded-full bg-current" />
              <span className="block h-[1.5px] w-5 rounded-full bg-current" />
              <span className="block h-[1.5px] w-5 rounded-full bg-current" />
            </span>
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
  label?: string;
  value: string;
  options: CategoryFilterOption[];
  onChange: (value: string) => void;
  className?: string;
};

/** Filter control — not navigation. */
export function CategoryFilterSelect({
  label = "Filtrar",
  value,
  options,
  onChange,
  className,
}: CategoryFilterSelectProps) {
  return (
    <label className={cn("block", className)}>
      <span className="sr-only">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[48px] w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 pr-10 text-[15px] font-medium text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)]"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[var(--color-text-tertiary)]"
          aria-hidden
        >
          ▾
        </span>
      </div>
    </label>
  );
}

export type HomeFeedCardProps = {
  categoryLabel: string;
  title: string;
  authorName: string;
  authorAvatarUrl?: string;
  timeLabel: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

/** Chronological community announcement — daily app, not a landing card wall. */
export function HomeFeedCard({
  categoryLabel,
  title,
  authorName,
  authorAvatarUrl,
  timeLabel,
  imageUrl,
  onClick,
  className,
}: HomeFeedCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      {imageUrl ? (
        <div className="aspect-[16/10] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <span className="block space-y-2.5 px-4 py-4">
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--color-action-primary)]">
          {categoryLabel}
        </span>
        <span className="block font-[family-name:var(--font-display)] text-[21px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="flex items-center gap-2.5 pt-0.5">
          {authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorAvatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[12px] font-semibold text-[var(--color-action-primary)]">
              {authorName.slice(0, 1)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
              {authorName}
            </span>
            <span className="block text-[12px] text-[var(--color-text-tertiary)]">
              {timeLabel}
            </span>
          </span>
        </span>
      </span>
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

/** Single non-intrusive sponsor placement — always disclosed. */
export function SponsoredFeedCard({
  badgeLabel,
  title,
  authorName,
  imageUrl,
  onClick,
  className,
}: SponsoredFeedCardProps) {
  const body = (
    <>
      {imageUrl ? (
        <div className="aspect-[21/9] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover opacity-90"
          />
        </div>
      ) : null}
      <span className="block space-y-2 px-4 py-3.5">
        <span className="inline-flex rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {badgeLabel}
        </span>
        <span className="block text-[17px] font-semibold leading-6 text-[var(--color-text-primary)]">
          {title}
        </span>
        {authorName ? (
          <span className="block text-[13px] text-[var(--color-text-secondary)]">
            {authorName}
          </span>
        ) : null}
      </span>
    </>
  );

  const surface = cn(
    "w-full overflow-hidden rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]/60 text-left",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(surface, "transition-transform active:scale-[0.99]")}
      >
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
  className?: string;
};

export function HomeFeedSection({
  title,
  filter,
  children,
  emptyLabel,
  className,
}: HomeFeedSectionProps) {
  const hasChildren = Boolean(
    children && !(Array.isArray(children) && children.length === 0),
  );

  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8 text-[var(--color-text-primary)]">
          {title}
        </h2>
        {filter}
      </div>
      {hasChildren ? (
        <div className="flex flex-col gap-3.5">{children}</div>
      ) : emptyLabel ? (
        <p className="rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)]/70 px-5 py-8 text-center text-[15px] leading-6 text-[var(--color-text-secondary)]">
          {emptyLabel}
        </p>
      ) : null}
    </section>
  );
}
