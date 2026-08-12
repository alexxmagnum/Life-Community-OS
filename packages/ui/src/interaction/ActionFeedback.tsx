import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";
import { interactionPreset } from "./presets";

export type ActionFeedbackProps = HTMLAttributes<HTMLDivElement> & {
  /** Visible confirmation text (required for meaning without motion). */
  label: string;
  /** Optional leading mark (e.g. check). Decorative if label already states success. */
  mark?: ReactNode;
  /** When false, skips the pop entrance class (still announces via status). */
  animate?: boolean;
};

/**
 * Brief, non-blocking action confirmation.
 * Meaning lives in `label` + `role="status"`; motion is optional polish.
 */
export function ActionFeedback({
  label,
  mark = "✓",
  animate = true,
  className,
  ...props
}: ActionFeedbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[var(--color-feedback-success-subtle)] px-3 py-1.5 text-[13px] font-semibold leading-4 text-[var(--color-feedback-success)]",
        animate && interactionPreset("pop"),
        className,
      )}
      {...props}
    >
      {mark != null ? (
        <span aria-hidden className="text-[14px] leading-none">
          {mark}
        </span>
      ) : null}
      <span>{label}</span>
    </div>
  );
}
