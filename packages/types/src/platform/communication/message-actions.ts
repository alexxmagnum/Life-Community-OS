/**
 * Message action semantics (Phase 2.5.3).
 *
 * Contextual long-press / menu actions — not permanent chrome.
 * Soft reactions remain in reactions.ts. Support/Vote stay separate.
 */

export const MESSAGE_ACTION_KINDS = [
  "reply",
  "react",
  "copy",
  "forward",
  "select",
  "delete_own",
] as const;

export type MessageActionKind = (typeof MESSAGE_ACTION_KINDS)[number];

export function isMessageActionKind(value: string): value is MessageActionKind {
  return (MESSAGE_ACTION_KINDS as readonly string[]).includes(value);
}

/**
 * Which actions are available depends on AuthZ + message ownership.
 * UI must not invent capabilities.
 */
export type MessageActionAvailability = {
  reply: boolean;
  react: boolean;
  copy: boolean;
  /** Forward is foundation-only until delivery exists. */
  forward: boolean;
  select: boolean;
  deleteOwn: boolean;
};

export const DEFAULT_MESSAGE_ACTION_AVAILABILITY: MessageActionAvailability = {
  reply: true,
  react: true,
  copy: true,
  forward: false,
  select: true,
  deleteOwn: true,
};
