/**
 * Shared interaction preset helpers — platform Design System.
 * Opt-in classNames for press / lift / pop / stagger. No tenant coupling.
 */

/** Last index that receives a staggered entrance (0…3 = first four items). */
export const INTERACTION_STAGGER_MAX_INDEX = 3;

export type InteractionPresetName = "press" | "lift" | "pop" | "stagger";

const PRESET_CLASS: Record<InteractionPresetName, string> = {
  press: "ui-press",
  lift: "ui-lift",
  pop: "ui-pop",
  stagger: "ui-stagger-item",
};

/** Returns a shared interaction className (opt-in). */
export function interactionPreset(preset: InteractionPresetName): string {
  return PRESET_CLASS[preset];
}

/** Clamp stagger index to the visible ladder (0…3). */
export function clampStaggerIndex(index: number): number {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), INTERACTION_STAGGER_MAX_INDEX);
}

/**
 * Props for a staggered child.
 * Indices 0…3 get capped delays; later items paint immediately (no stagger class).
 */
export function staggerItemProps(index: number): {
  className: string;
  "data-stagger-index"?: string;
} {
  if (!Number.isFinite(index) || index < 0) {
    return {
      className: interactionPreset("stagger"),
      "data-stagger-index": "0",
    };
  }

  const floored = Math.floor(index);
  if (floored > INTERACTION_STAGGER_MAX_INDEX) {
    return { className: "" };
  }

  return {
    className: interactionPreset("stagger"),
    "data-stagger-index": String(floored),
  };
}
