"use client";

import { cn } from "../lib/cn";
import { useMediaLightbox } from "../media/MediaLightbox";

export type AvatarProps = {
  src?: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** When false, avatar is not zoomable (rare). Default true. */
  zoomable?: boolean;
};

const sizes = {
  xs: "h-7 w-7",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

export function Avatar({
  src,
  alt,
  size = "md",
  className,
  zoomable = true,
}: AvatarProps) {
  const lightbox = useMediaLightbox();
  const canZoom = Boolean(src && zoomable && lightbox);

  const face = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-full w-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
      {alt.slice(0, 1).toUpperCase()}
    </span>
  );

  const shell = cn(
    "inline-flex shrink-0 overflow-hidden rounded-full bg-[var(--color-surface-muted)] ring-2 ring-[var(--color-surface-elevated)]",
    sizes[size],
    className,
  );

  if (canZoom) {
    return (
      <button
        type="button"
        className={shell}
        aria-label={`Ampliar foto de ${alt}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          lightbox?.open(src!, alt);
        }}
      >
        {face}
      </button>
    );
  }

  return <span className={shell}>{face}</span>;
}
