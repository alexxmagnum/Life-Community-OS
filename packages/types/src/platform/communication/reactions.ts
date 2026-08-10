/**
 * Message reaction foundation (ADR-043 / D.0.5a / Phase 2.5.3).
 *
 * Soft affect only — NOT Support, NOT Vote.
 */

export const REACTION_TYPES = [
  "thumbs_up",
  "heart",
  "laugh",
  "surprised",
  "pray",
  "clap",
  "wave",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

/** Display glyphs for the foundation reaction set. */
export const REACTION_TYPE_GLYPH: Readonly<Record<ReactionType, string>> = {
  thumbs_up: "👍",
  heart: "❤️",
  laugh: "😂",
  surprised: "😮",
  pray: "🙏",
  clap: "👏",
  wave: "👋",
};

/** Aggregated counts per reaction on a Message. */
export type MessageReactionSummary = Partial<Record<ReactionType, number>>;

/** Who reacted — for summary expansion (not AuthZ). */
export type MessageReactor = {
  personId: string;
  displayName: string;
  avatarUrl?: string;
  reaction: ReactionType;
  createdAt?: string;
};

export function isReactionType(value: string): value is ReactionType {
  return (REACTION_TYPES as readonly string[]).includes(value);
}

export function emptyMessageReactionSummary(): MessageReactionSummary {
  return {};
}
