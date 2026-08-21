"use client";

import { cn } from "../lib/cn";

export type MediaPreviewKind = "image" | "document" | "unknown";

export type MediaPreviewProps = {
  kind: MediaPreviewKind;
  /** Display title — never a raw blob URL requirement. */
  title: string;
  subtitle?: string;
  /**
   * Optional preview URL when a real FileReference variant exists.
   * Do not invent uploads — omit until Files pipeline is wired.
   */
  previewUrl?: string;
  onOpen?: () => void;
  className?: string;
};

/**
 * Media / document preview foundation — no fake gallery, no fake uploads.
 */
export function MediaPreview({
  kind,
  title,
  subtitle,
  previewUrl,
  onOpen,
  className,
}: MediaPreviewProps) {
  const glyph = kind === "image" ? "🖼" : kind === "document" ? "📄" : "📎";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className={cn(
        "flex w-full max-w-[min(78%,16rem)] items-stretch overflow-hidden rounded-[14px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-left disabled:opacity-90",
        className,
      )}
      aria-label={title}
    >
      <div className="flex w-14 shrink-0 items-center justify-center bg-[var(--color-surface-muted)] text-[22px]">
        {previewUrl && kind === "image" ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{glyph}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-tertiary)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </button>
  );
}
