import type { ButtonHTMLAttributes } from "react";

import {
  interactionPreset,
  staggerItemProps,
} from "../interaction/presets";
import { cn } from "../lib/cn";

/**
 * Shared pad surface tones — platform recipes (see asset-pad.css).
 * Caller selects tone; AssetPad never hardcodes product categories.
 */
export type AssetPadTone =
  | "neutral"
  | "cyan"
  | "copper"
  | "green"
  | "blue"
  | "purple"
  | "berry"
  | "teal";

export type AssetPadProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type"
> & {
  /**
   * Resolved public URL for a type:card 3D WebP.
   * Caller owns registry lookup. When omitted / empty → same pad geometry
   * with empty visual space (placeholder), ready for a future CARD.
   */
  assetSrc?: string;
  title: string;
  /** Secondary line under the title (keep short in dense grids). */
  meta?: string;
  /**
   * Surface tint for the pad material. Defaults to `neutral`.
   * Product/config chooses tone — never encode category → color here.
   */
  tone?: AssetPadTone;
  onClick?: () => void;
  /** Opt-in entrance index (stagger only for 0…3). */
  staggerIndex?: number;
};

/**
 * Shared navigation pad for type:card 3D assets.
 * Presentational only — no registry, tenant, or business keys.
 *
 * Layers: tonal material → wave → CARD asset → readability → HTML copy → CTA.
 */
export function AssetPad({
  assetSrc,
  title,
  meta,
  tone = "neutral",
  onClick,
  staggerIndex,
  className,
  ...props
}: AssetPadProps) {
  const stagger =
    typeof staggerIndex === "number" ? staggerItemProps(staggerIndex) : null;
  const hasAsset = Boolean(assetSrc);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={meta ? `${title}. ${meta}` : title}
      data-stagger-index={stagger?.["data-stagger-index"]}
      data-tone={tone}
      className={cn(
        "ui-asset-pad",
        interactionPreset("press"),
        stagger?.className,
        className,
      )}
      {...props}
    >
      {/* Tonal wave — same hue family, static, UI-owned */}
      <span className="ui-asset-pad__wave" aria-hidden />

      {/* Asset zone — overlaps wave for depth; lift only with real CARD */}
      <span
        className={cn(
          "ui-asset-pad__asset",
          hasAsset && interactionPreset("lift"),
        )}
        aria-hidden
      >
        {hasAsset ? (
          <img
            src={assetSrc}
            alt=""
            width={512}
            height={341}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <span className="ui-asset-pad__placeholder" />
        )}
      </span>

      <span className="ui-asset-pad__falloff" aria-hidden />

      <span className="ui-asset-pad__content">
        <span className="ui-asset-pad__title line-clamp-2">{title}</span>
        {meta ? (
          <span className="ui-asset-pad__meta line-clamp-2">{meta}</span>
        ) : null}
        <span className="ui-asset-pad__cta" aria-hidden>
          →
        </span>
      </span>
    </button>
  );
}
