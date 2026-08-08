/**
 * Semantic quick actions on Messages (ADR-043 / D.0.5a).
 *
 * Shortcuts that may later emit domain events (e.g. joining → experience join).
 * They are not chat permissions and never grant AuthZ.
 */

export const QUICK_ACTION_KINDS = [
  "going",
  "joining",
  "thanks",
  "late",
] as const;

export type QuickActionKind = (typeof QUICK_ACTION_KINDS)[number];

export function isQuickActionKind(value: string): value is QuickActionKind {
  return (QUICK_ACTION_KINDS as readonly string[]).includes(value);
}
