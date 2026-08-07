import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type MarketplaceItemCardProps = {
  kindLabel: string;
  title: string;
  meta: string;
  priceLabel?: string;
  imageUrl: string;
  authorName?: string;
  onClick?: () => void;
  className?: string;
};

/** Neighbour exchange listing — not commercial storefront chrome. */
export function MarketplaceItemCard({
  kindLabel,
  title,
  meta,
  priceLabel,
  imageUrl,
  authorName,
  onClick,
  className,
}: MarketplaceItemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <div className="h-[112px] w-[112px] shrink-0 bg-[var(--color-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <span className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-action-accent)]">
          {kindLabel}
        </span>
        <span className="mt-1 line-clamp-2 text-[16px] font-semibold leading-5 text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="mt-1 line-clamp-1 text-[13px] text-[var(--color-text-secondary)]">
          {meta}
          {authorName ? ` · ${authorName}` : ""}
        </span>
        {priceLabel ? (
          <span className="mt-2 text-[15px] font-semibold text-[var(--color-action-primary)]">
            {priceLabel}
          </span>
        ) : null}
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
          <h3 className="text-[18px] font-semibold leading-6 text-[var(--color-text-primary)]">
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
            className="flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-action-primary)] text-[16px] font-semibold text-[var(--color-text-inverse)]"
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
