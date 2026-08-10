"use client";

import { cn } from "../lib/cn";

export type ReactionPickerOption = {
  id: string;
  glyph: string;
  count?: number;
  active?: boolean;
};

export type ReactionPickerProps = {
  options: ReactionPickerOption[];
  onSelect: (id: string) => void;
  /** Soft reactions only — never Support or Vote. */
  className?: string;
};

/**
 * Message / content soft-reaction picker.
 * Must not be used for proposal Support or formal Vote.
 */
export function ReactionPicker({
  options,
  onSelect,
  className,
}: ReactionPickerProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-x-2 gap-y-1", className)}
      role="group"
      aria-label="Reacciones"
    >
      {options.map((option) => {
        const count = option.count ?? 0;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              "min-h-[28px] rounded-full px-1.5 text-[12px]",
              option.active || count > 0
                ? "font-semibold text-[var(--color-action-primary)]"
                : "font-medium text-[var(--color-text-tertiary)]",
            )}
            aria-label={`Reacción ${option.glyph}`}
            aria-pressed={option.active ?? false}
          >
            {option.glyph}
            {count > 0 ? ` ${count}` : ""}
          </button>
        );
      })}
    </div>
  );
}
