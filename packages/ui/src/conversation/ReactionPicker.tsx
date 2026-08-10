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
  /**
   * - `bar` — contextual long-press tray (soft reactions only)
   * - `summary` — compact chips for reactions that already have counts
   * - `inline` — legacy compact row (prefer bar + summary)
   */
  variant?: "bar" | "summary" | "inline";
  className?: string;
};

/**
 * Soft reaction UI — never Support or Vote.
 * Prefer contextual `bar` over always-visible emoji rows.
 */
export function ReactionPicker({
  options,
  onSelect,
  variant = "inline",
  className,
}: ReactionPickerProps) {
  if (variant === "summary") {
    const visible = options.filter((o) => (o.count ?? 0) > 0);
    if (visible.length === 0) return null;
    return (
      <div
        className={cn(
          "inline-flex flex-wrap gap-1 rounded-full bg-[var(--color-surface-elevated)] px-1.5 py-0.5 shadow-[var(--shadow-elev-1)]",
          className,
        )}
        role="group"
        aria-label="Reacciones"
      >
        {visible.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="inline-flex min-h-[24px] items-center gap-0.5 px-1 text-[12px] font-semibold text-[var(--color-text-secondary)]"
            aria-label={`Reacción ${option.glyph}`}
          >
            <span aria-hidden>{option.glyph}</span>
            <span>{option.count}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-[var(--color-surface-elevated)] px-1.5 py-1 shadow-[var(--shadow-elev-2)]",
          className,
        )}
        role="listbox"
        aria-label="Elegir reacción"
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="option"
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-[18px] transition-transform active:scale-90",
              option.active
                ? "bg-[var(--color-action-primary-subtle)]"
                : "hover:bg-[var(--color-surface-muted)]",
            )}
            aria-label={`Reacción ${option.glyph}`}
            aria-selected={option.active ?? false}
          >
            {option.glyph}
          </button>
        ))}
      </div>
    );
  }

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
