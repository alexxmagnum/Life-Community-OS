"use client";

import { cn } from "../lib/cn";

export type SupportCardProps = {
  title: string;
  description?: string;
  /** Real support count only — never invent metrics. */
  supportCount: number;
  /** Tenant terminology, e.g. "vecinos apoyan esto". */
  supportCountLabel: string;
  supportedByViewer?: boolean;
  supportLabel?: string;
  unsupportLabel?: string;
  viewSupportersLabel?: string;
  onSupport?: () => void;
  onViewSupporters?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Proposal endorsement card — Support, not Reaction, not Vote.
 */
export function SupportCard({
  title,
  description,
  supportCount,
  supportCountLabel,
  supportedByViewer = false,
  supportLabel = "Apoyar",
  unsupportLabel = "Quitar apoyo",
  viewSupportersLabel = "Ver apoyos",
  onSupport,
  onViewSupporters,
  disabled = false,
  className,
}: SupportCardProps) {
  return (
    <article
      className={cn(
        "space-y-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <div>
        <h3 className="text-[16px] font-semibold leading-snug text-[var(--color-text-primary)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1.5 text-[14px] leading-5 text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
        {supportCount} {supportCountLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {onSupport ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onSupport}
            className={cn(
              "min-h-[44px] rounded-[var(--radius-md)] px-4 text-[14px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-45",
              supportedByViewer
                ? "bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]"
                : "bg-[var(--color-action-primary)] text-[var(--color-text-on-action)]",
            )}
          >
            {supportedByViewer ? unsupportLabel : supportLabel}
          </button>
        ) : null}
        {onViewSupporters ? (
          <button
            type="button"
            onClick={onViewSupporters}
            className="min-h-[44px] rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 text-[14px] font-semibold text-[var(--color-text-primary)]"
          >
            {viewSupportersLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
