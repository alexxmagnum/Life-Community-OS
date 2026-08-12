import type { ButtonHTMLAttributes, ReactNode } from "react";

import {
  interactionPreset,
  staggerItemProps,
} from "../interaction/presets";
import { cn } from "../lib/cn";

export type CategoryDoorCardProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type"
> & {
  title: string;
  description: string;
  onClick: () => void;
  /** Resolved public URL (caller owns registry lookup). */
  assetSrc?: string;
  /** Shown when assetSrc is missing. */
  fallbackGlyph?: ReactNode;
  /** Background tint for the glyph/asset well. */
  tintClassName?: string;
  /** Opt-in entrance index (stagger only for 0…3; later paint immediately). */
  staggerIndex?: number;
};

/**
 * Shared category / hub door — press on the row, soft lift on media.
 * Motion via platform interaction presets; no tenant coupling.
 */
export function CategoryDoorCard({
  title,
  description,
  onClick,
  assetSrc,
  fallbackGlyph = "•",
  tintClassName = "bg-[var(--color-action-primary-subtle)]",
  staggerIndex,
  className,
  ...props
}: CategoryDoorCardProps) {
  const stagger =
    typeof staggerIndex === "number" ? staggerItemProps(staggerIndex) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      data-stagger-index={stagger?.["data-stagger-index"]}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] backdrop-blur-md",
        interactionPreset("press"),
        stagger?.className,
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-visible rounded-[14px]",
          tintClassName,
        )}
        aria-hidden
      >
        {assetSrc ? (
          <span
            className={cn(
              "flex h-full w-full items-center justify-center p-1",
              interactionPreset("lift"),
            )}
          >
            <img
              src={assetSrc}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-contain"
            />
          </span>
        ) : (
          <span className="text-[22px] leading-none">{fallbackGlyph}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="mt-1 block text-[14px] leading-snug text-[var(--color-text-secondary)]">
          {description}
        </span>
      </span>
      <span
        className="mt-1 shrink-0 text-[var(--color-text-tertiary)]"
        aria-hidden
      >
        ›
      </span>
    </button>
  );
}
