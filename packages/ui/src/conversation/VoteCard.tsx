"use client";

import { cn } from "../lib/cn";

export type VoteCardOption = {
  id: string;
  label: string;
};

export type VoteCardProps = {
  question: string;
  options: VoteCardOption[];
  /** e.g. "Abre el 12 mar · Cierra el 20 mar" */
  windowLabel?: string;
  eligibilityHint?: string;
  /**
   * Foundation only — casting is disabled until Vote product is ready.
   * Do not invent fake ballots.
   */
  castingEnabled?: boolean;
  unavailableNote?: string;
  onSelectOption?: (optionId: string) => void;
  className?: string;
};

/**
 * Formal Vote presentation shell — no fake casting by default.
 */
export function VoteCard({
  question,
  options,
  windowLabel,
  eligibilityHint,
  castingEnabled = false,
  unavailableNote = "La votación formal aún no está disponible.",
  onSelectOption,
  className,
}: VoteCardProps) {
  return (
    <article
      className={cn(
        "space-y-3 rounded-[16px] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]",
        className,
      )}
    >
      <h3 className="text-[16px] font-semibold leading-snug text-[var(--color-text-primary)]">
        {question}
      </h3>
      {windowLabel ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {windowLabel}
        </p>
      ) : null}
      {eligibilityHint ? (
        <p className="text-[13px] text-[var(--color-text-tertiary)]">
          {eligibilityHint}
        </p>
      ) : null}
      <ul className="space-y-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              disabled={!castingEnabled}
              onClick={() => onSelectOption?.(option.id)}
              className="flex min-h-[44px] w-full items-center rounded-[12px] bg-[var(--color-surface-muted)] px-3.5 text-left text-[14px] font-semibold text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      {!castingEnabled ? (
        <p className="text-[12px] leading-4 text-[var(--color-text-tertiary)]">
          {unavailableNote}
        </p>
      ) : null}
    </article>
  );
}
