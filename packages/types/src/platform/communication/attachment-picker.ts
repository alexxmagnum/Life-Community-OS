/**
 * Attachment / media picker foundation (Phase 2.5.3).
 *
 * Extension points only — no fake uploads, no blob persistence here.
 * Actual files must use Core Files (ADR-020) when wired.
 */

export const ATTACHMENT_PICKER_KINDS = [
  "photo",
  "camera",
  "document",
  "location",
  "contact",
] as const;

export type AttachmentPickerKind = (typeof ATTACHMENT_PICKER_KINDS)[number];

export function isAttachmentPickerKind(
  value: string,
): value is AttachmentPickerKind {
  return (ATTACHMENT_PICKER_KINDS as readonly string[]).includes(value);
}

export const ATTACHMENT_FOUNDATION_NOTE =
  "Attachment picker is UX foundation only. Do not invent uploads or FileReference rows without Files pipeline.";
