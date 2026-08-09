"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { ZoomableImage } from "../media/MediaLightbox";

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
        <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
      </div>
      <span className="block space-y-3 p-4">
        <span className="inline-flex rounded-full bg-[var(--color-action-accent-subtle)] px-3 py-1 text-[14px] font-semibold text-[var(--color-action-accent)]">
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
            <ZoomableImage
              src={authorAvatarUrl}
              alt={authorName ?? ""}
              zoomable
              className="rounded-full"
              wrapperClassName="h-9 w-9 shrink-0 rounded-full"
            />
          ) : authorName ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-[15px] font-semibold text-[var(--color-action-primary)]">
              {authorName.slice(0, 1)}
            </span>
          ) : null}
          <span className="min-w-0">
            {authorName ? (
              <span className="block text-[15px] font-semibold text-[var(--color-text-primary)]">
                {authorName}
              </span>
            ) : null}
            <span className="block text-[15px] text-[var(--color-text-tertiary)]">
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
  trustNote?: string;
  /** immersive = photo story; discovery = CERCA DE TI magazine tile */
  variant?: "immersive" | "discovery";
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
  trustNote,
  variant = "immersive",
  onClick,
  className,
}: LocalPlaceCardProps) {
  const interactive = typeof onClick === "function";
  const Root = interactive ? "button" : "div";
  const rootProps = interactive
    ? { type: "button" as const, onClick }
    : { role: "group" as const };

  if (variant === "discovery") {
    return (
      <Root
        {...rootProps}
        className={cn(
          "w-[148px] shrink-0 overflow-hidden rounded-[20px] bg-[var(--color-surface-elevated)] text-left shadow-[0_4px_16px_rgba(26,31,28,0.06)]",
          interactive ? "transition-transform active:scale-[0.99]" : undefined,
          className,
        )}
      >
        <div className="aspect-square bg-[var(--color-surface-muted)]">
          <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        </div>
        <span className="block space-y-1 px-3 py-3">
          <span className="font-display block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
            {name}
          </span>
          <span className="block truncate text-[15px] text-[var(--color-text-tertiary)]">
            {categoryLabel}
            {areaLabel ? ` · ${areaLabel}` : ""}
          </span>
          {recommendedBy ? (
            <span className="block text-[15px] leading-4 text-[var(--color-text-secondary)]">
              Por {recommendedBy}
            </span>
          ) : null}
        </span>
      </Root>
    );
  }

  return (
    <Root
      {...rootProps}
      className={cn(
        "w-[min(78vw,280px)] shrink-0 overflow-hidden rounded-[24px] text-left shadow-[0_8px_24px_rgba(26,31,28,0.08)]",
        interactive ? "transition-transform active:scale-[0.99]" : undefined,
        className,
      )}
    >
      <div className="relative aspect-[4/5] bg-[var(--color-surface-muted)]">
        <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4"
          style={{
            background:
              "linear-gradient(transparent 40%, rgba(20,28,24,0.72))",
          }}
        >
          <span className="text-[14px] font-semibold text-[var(--color-text-inverse)]/80">
            {categoryLabel}
            {verified ? " · Verificado" : ""}
          </span>
          <span className="mt-1 font-[family-name:var(--font-display)] text-[22px] font-semibold leading-6 text-[var(--color-text-inverse)]">
            {name}
          </span>
          <span className="mt-1 text-[15px] text-[var(--color-text-inverse)]/85">
            {areaLabel}
            {recommendedBy ? ` · Recomendado por ${recommendedBy}` : ""}
          </span>
          {blurb ? (
            <span className="mt-2 line-clamp-2 text-[15px] leading-5 text-[var(--color-text-inverse)]/75">
              {blurb}
            </span>
          ) : null}
          {trustNote ? (
            <span className="mt-2 text-[14px] font-medium text-[var(--color-text-inverse)]/90">
              {trustNote}
            </span>
          ) : null}
        </div>
      </div>
    </Root>
  );
}

export type LocalLifeRailProps = {
  children: ReactNode;
  className?: string;
};

/** Horizontal story rail — scrolls inside, never overflows the page. */
export function LocalLifeRail({ children, className }: LocalLifeRailProps) {
  return (
    <div
      className={cn(
        "-mx-2.5 overflow-x-auto px-2.5 pb-1 [scrollbar-width:none]",
        className,
      )}
    >
      <div className="flex w-max gap-3">{children}</div>
    </div>
  );
}

export type NeighbourTipCardProps = {
  quote: string;
  author: string;
  relatedLabel?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

/** Trust story from a neighbour — not a star-rating review widget. */
export function NeighbourTipCard({
  quote,
  author,
  relatedLabel,
  imageUrl,
  onClick,
  className,
}: NeighbourTipCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {imageUrl ? (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
          <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        </div>
      ) : null}
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold uppercase tracking-wide text-[var(--color-accent-community)]">
          Vecino
        </span>
        <span className="mt-1 block text-[16px] leading-6 text-[var(--color-text-primary)]">
          &ldquo;{quote}&rdquo;
        </span>
        <span className="mt-2 block text-[15px] text-[var(--color-text-secondary)]">
          {author}
          {relatedLabel ? ` · ${relatedLabel}` : ""}
        </span>
      </span>
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
  ctaLabel = "Apuntarme",
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
          <ZoomableImage src={imageUrl} alt="" wrapperClassName="h-full w-full" />
        </div>
        <div className="p-4">
          <h3 className="font-[family-name:var(--font-display)] text-[20px] font-semibold leading-6 text-[var(--color-text-primary)]">
            {title}
          </h3>
          <p className="mt-1 text-[15px] text-[var(--color-text-secondary)]">
            {when} · {where}
          </p>
          {peopleLabel ? (
            <p className="mt-1 text-[15px] text-[var(--color-text-tertiary)]">
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
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-7 text-[var(--color-text-primary)]">
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

