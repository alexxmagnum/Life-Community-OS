"use client";

import { cn } from "../lib/cn";

export type VoteResultRow = {
  optionId: string;
  label: string;
  count: number;
};

export type VoteResultsProps = {
  rows: VoteResultRow[];
  turnoutLabel?: string;
  closedLabel?: string;
  className?: string;
};

/**
 * Closed vote results — only with real tallies (never invent).
 */
export function VoteResults({
  rows,
  turnoutLabel,
  closedLabel,
  className,
}: VoteResultsProps) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div
      className={cn(
        "space-y-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      {closedLabel ? (
        <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
          {closedLabel}
        </p>
      ) : null}
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
          return (
            <li key={row.optionId}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                  {row.label}
                </span>
                <span className="text-[12px] text-[var(--color-text-tertiary)]">
                  {row.count} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--color-action-primary)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {turnoutLabel ? (
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          {turnoutLabel}
        </p>
      ) : null}
    </div>
  );
}
