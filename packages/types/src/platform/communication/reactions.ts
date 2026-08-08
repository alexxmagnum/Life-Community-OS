/**
 * Message reaction foundation (ADR-043 / D.0.5a).
 *
 * English identifiers match project style; glyphs are presentation only.
 * Reactions are not permissions and do not affect AuthZ or contribution scores.
 */

export const REACTION_TYPES = [
  "thumbs_up",
  "heart",
  "laugh",
  "clap",
  "wave",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

/** Display glyphs for the foundation reaction set. */
export const REACTION_TYPE_GLYPH: Readonly<Record<ReactionType, string>> = {
  thumbs_up: "👍",
  heart: "❤️",
  laugh: "😂",
  clap: "👏",
  wave: "👋",
};

/** Aggregated counts per reaction on a Message. */
export type MessageReactionSummary = Partial<Record<ReactionType, number>>;

export function isReactionType(value: string): value is ReactionType {
  return (REACTION_TYPES as readonly string[]).includes(value);
}

export function emptyMessageReactionSummary(): MessageReactionSummary {
  return {};
}
