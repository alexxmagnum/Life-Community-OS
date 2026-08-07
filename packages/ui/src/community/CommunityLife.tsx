import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type MarketplaceItemCardProps = {
  kindLabel: string;
  title: string;
  meta: string;
  priceLabel?: string;
  imageUrl: string;
  authorName?: string;
  authorAvatarUrl?: string;
  onClick?: () => void;
  className?: string;
};

/** Neighbour exchange — people and trust first, not a storefront. */
export function MarketplaceItemCard({
  kindLabel,
  title,
  meta,
  priceLabel,
  imageUrl,
  authorName,
  authorAvatarUrl,
  onClick,
  className,
}: MarketplaceItemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <div className="aspect-[16/10] bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <span className="block space-y-3 p-4">
        <span className="inline-flex rounded-full bg-[var(--color-action-accent-subtle)] px-3 py-1 text-[12px] font-semibold text-[var(--color-action-accent)]">
          {kindLabel}
        </span>
        <span className="block font-[family-name:var(--font-display)] text-[22px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </span>
        {priceLabel ? (
          <span className="block text-[17px] font-semibold text-[var(--color-action-primary)]">
            {priceLabel}
          </span>
        ) : null}
        <span className="flex items-center gap-3 pt-1">
          {authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorAvatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : authorName ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[13px] font-semibold text-[var(--color-action-primary)]">
              {authorName.slice(0, 1)}
            </span>
          ) : null}
          <span className="min-w-0">
            {authorName ? (
              <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
                {authorName}
              </span>
            ) : null}
            <span className="block text-[13px] text-[var(--color-text-tertiary)]">
              {meta}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}

export type LocalPlaceCardProps = {
  name: string;
  categoryLabel: string;
  areaLabel: string;
  blurb?: string;
  imageUrl: string;
  recommendedBy?: string;
  verified?: boolean;
  onClick?: () => void;
  className?: string;
};

export function LocalPlaceCard({
  name,
  categoryLabel,
  areaLabel,
  blurb,
  imageUrl,
  recommendedBy,
  verified,
  onClick,
  className,
}: LocalPlaceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[78vw] max-w-[280px] shrink-0 overflow-hidden rounded-[var(--radius-xl)] text-left sm:min-w-[240px]",
        className,
      )}
    >
      <div className="relative aspect-[4/5] bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0 flex flex-col justify-end p-4"
          style={{
            background:
              "linear-gradient(transparent 40%, rgba(20,28,24,0.72))",
          }}
        >
          <span className="text-[12px] font-semibold text-[var(--color-text-inverse)]/80">
            {categoryLabel}
            {verified ? " · Verificado" : ""}
          </span>
          <span className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold leading-6 text-[var(--color-text-inverse)]">
            {name}
          </span>
          <span className="mt-1 text-[13px] text-[var(--color-text-inverse)]/85">
            {areaLabel}
            {recommendedBy ? ` · ${recommendedBy}` : ""}
          </span>
          {blurb ? (
            <span className="mt-2 line-clamp-2 text-[13px] leading-5 text-[var(--color-text-inverse)]/75">
              {blurb}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export type ActivityCardProps = {
  title: string;
  when: string;
  where: string;
  peopleLabel?: string;
  imageUrl: string;
  ctaLabel?: string;
  onClick?: () => void;
  onCta?: () => void;
  className?: string;
};

export function ActivityCard({
  title,
  when,
  where,
  peopleLabel,
  imageUrl,
  ctaLabel = "Participar",
  onClick,
  onCta,
  className,
}: ActivityCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <button type="button" className="block w-full text-left" onClick={onClick}>
        <div className="aspect-[16/10] bg-[var(--color-surface-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="p-4">
          <h3 className="font-[family-name:var(--font-display)] text-[20px] font-semibold leading-6 text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
            {when} · {where}
          </p>
          {peopleLabel ? (
            <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
              {peopleLabel}
            </p>
          ) : null}
        </div>
      </button>
      {onCta ? (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onCta}
            className="flex min-h-[52px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)]"
          >
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export type CommunityLifeSectionProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
};

export function CommunityLifeSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  className,
}: CommunityLifeSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-8">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-[15px] leading-6 text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-[14px] font-semibold text-[var(--color-action-primary)]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
