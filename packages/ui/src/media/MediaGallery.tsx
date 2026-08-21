"use client";

import { cn } from "../lib/cn";
import { ZoomableImage } from "./MediaLightbox";

export type MediaGalleryItem = {
  id: string;
  url: string;
  alt?: string;
};

export type MediaGalleryProps = {
  items: MediaGalleryItem[];
  emptyLabel?: string;
  className?: string;
};

export function MediaGallery({
  items,
  emptyLabel = "Sin archivos todavía",
  className,
}: MediaGalleryProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[16/9] items-center justify-center rounded-[var(--radius-xl)] bg-[var(--color-surface-muted)] text-[14px] text-[var(--color-text-tertiary)]",
          className,
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
        >
          <ZoomableImage
            src={item.url}
            alt={item.alt ?? ""}
            className="aspect-square w-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
