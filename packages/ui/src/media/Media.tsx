/**
 * ADR-020 media UI preparation — no storage implementation.
 * Presentational placeholders for capture / preview / gallery patterns.
 */

import { Button } from "../actions/Button";
import { cn } from "../lib/cn";

export function MediaCapturePlaceholder({
  label = "Take a photo",
  hint = "Camera opens here when connected",
  className,
}: {
  label?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] px-6 text-center",
        className,
      )}
    >
      <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
        {label}
      </p>
      <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
        {hint}
      </p>
      <Button variant="secondary" className="mt-4" type="button" disabled>
        Open camera
      </Button>
    </div>
  );
}

export function MediaPreviewPlaceholder({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-video items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-[15px] text-[var(--color-text-secondary)]",
        className,
      )}
    >
      Preview · Retake / Use
    </div>
  );
}
