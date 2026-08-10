/**
 * Soft content reactions — NOT Support, NOT Vote.
 *
 * Used on posts / comments for lightweight acknowledgement.
 * Distinct from message emoji reactions (`communication/reactions.ts`).
 */

export const SOFT_REACTION_KINDS = ["acknowledge", "like"] as const;

export type SoftReactionKind = (typeof SOFT_REACTION_KINDS)[number];

export type SoftReactionSummary = Partial<Record<SoftReactionKind, number>>;

export function isSoftReactionKind(value: string): value is SoftReactionKind {
  return (SOFT_REACTION_KINDS as readonly string[]).includes(value);
}

export function emptySoftReactionSummary(): SoftReactionSummary {
  return {};
}

/**
 * Architecture note — do not collapse these concepts in product or UI.
 * Legacy tenant labels may still show "Apoyo" as a soft toggle until Support
 * migration completes; new code must use SupportRecord for proposal endorsement.
 */
export const PARTICIPATION_SEPARATION_NOTE =
  "Reaction (soft affect) ≠ Support (proposal endorsement) ≠ Vote (formal decision).";
