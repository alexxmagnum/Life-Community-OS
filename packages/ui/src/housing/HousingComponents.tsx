"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { ZoomableImage } from "../media/MediaLightbox";

export type HousingListingCardProps = {
  categoryLabel: string;
  title: string;
  meta: string;
  priceLabel?: string;
  statusLabel?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

/** Compact listing row for explore / mine / saved lists. */
export function HousingListingCard({
  categoryLabel,
  title,
  meta,
  priceLabel,
  statusLabel,
  imageUrl,
  onClick,
  className,
}: HousingListingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-3 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]",
        className,
      )}
    >
      <span className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-[var(--color-surface-muted)]">
        {imageUrl ? (
          <ZoomableImage
            src={imageUrl}
            alt=""
            zoomable={false}
            wrapperClassName="h-full w-full"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1 space-y-1.5 py-0.5">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--color-action-primary)]">
            {categoryLabel}
          </span>
          {statusLabel ? (
            <span className="inline-flex rounded-full bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-text-secondary)]">
              {statusLabel}
            </span>
          ) : null}
        </span>
        <span className="block truncate text-[16px] font-semibold leading-snug text-[var(--color-text-primary)]">
          {title}
        </span>
        {priceLabel ? (
          <span className="block text-[15px] font-semibold text-[var(--color-action-primary)]">
            {priceLabel}
          </span>
        ) : null}
        <span className="block truncate text-[13px] text-[var(--color-text-tertiary)]">
          {meta}
        </span>
      </span>
    </button>
  );
}

export type HousingFilterBarItem = {
  id: string;
  label: string;
};

export type HousingFilterBarProps = {
  items: readonly HousingFilterBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

/** Basic category / facet chips for Housing explore. */
export function HousingFilterBar({
  items,
  activeId,
  onChange,
  className,
}: HousingFilterBarProps) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]",
        className,
      )}
      role="tablist"
      aria-label="Filtros de vivienda"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={
              active
                ? "min-h-[40px] shrink-0 rounded-full bg-[var(--color-action-primary)] px-3.5 text-[14px] font-semibold text-white"
                : "min-h-[40px] shrink-0 rounded-full bg-[var(--color-surface-muted)] px-3.5 text-[14px] font-semibold text-[var(--color-text-secondary)]"
            }
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export type HousingDetailMedia = {
  id: string;
  url: string;
  alt?: string;
};

export type HousingDetailProps = {
  categoryLabel: string;
  statusLabel: string;
  title: string;
  description: string;
  priceLabel?: string;
  locationLabel?: string;
  facts?: readonly string[];
  amenities?: readonly string[];
  media?: readonly HousingDetailMedia[];
  /** Contact / save / owner actions — owned by the screen. */
  actions?: ReactNode;
  className?: string;
};

/** Presentational listing detail — no AuthZ or routing. */
export function HousingDetail({
  categoryLabel,
  statusLabel,
  title,
  description,
  priceLabel,
  locationLabel,
  facts,
  amenities,
  media,
  actions,
  className,
}: HousingDetailProps) {
  const cover = media?.[0];

  return (
    <article className={cn("space-y-4", className)}>
      {cover ? (
        <ZoomableImage
          src={cover.url}
          alt={cover.alt ?? ""}
          zoomable
          fill={false}
          className="aspect-[16/10] w-full rounded-[12px]"
          wrapperClassName="h-auto w-full overflow-hidden rounded-[12px]"
        />
      ) : (
        <div className="aspect-[16/10] w-full rounded-[12px] bg-[var(--color-surface-muted)]" />
      )}

      {(media?.length ?? 0) > 1 ? (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {media!.slice(1).map((item) => (
            <ZoomableImage
              key={item.id}
              src={item.url}
              alt={item.alt ?? ""}
              zoomable
              fill={false}
              className="h-16 w-20 rounded-[10px] object-cover"
              wrapperClassName="h-16 w-20 shrink-0 overflow-hidden rounded-[10px]"
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-[var(--color-action-primary-subtle)] px-3 py-1 text-[13px] font-semibold text-[var(--color-action-primary)]">
            {categoryLabel}
          </span>
          <span className="inline-flex rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[13px] font-medium text-[var(--color-text-secondary)]">
            {statusLabel}
          </span>
        </div>
        <h2 className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
          {title}
        </h2>
        {priceLabel ? (
          <p className="text-[16px] font-semibold text-[var(--color-action-primary)]">
            {priceLabel}
          </p>
        ) : null}
        {locationLabel ? (
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            {locationLabel}
          </p>
        ) : null}
        <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>

      {facts && facts.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {facts.map((fact) => (
            <li
              key={fact}
              className="rounded-[10px] bg-[var(--color-surface-muted)] px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)]"
            >
              {fact}
            </li>
          ))}
        </ul>
      ) : null}

      {amenities && amenities.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            Características
          </p>
          <p className="text-[14px] leading-5 text-[var(--color-text-secondary)]">
            {amenities.join(" · ")}
          </p>
        </div>
      ) : null}

      {actions ? <div className="space-y-2 pt-1">{actions}</div> : null}
    </article>
  );
}
