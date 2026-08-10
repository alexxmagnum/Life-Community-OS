"use client";

import { Avatar } from "../people/Avatar";
import { EmptyState } from "../states/States";
import { cn } from "../lib/cn";

export type SupporterListItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Preformatted time (tenant / locale). */
  whenLabel?: string;
  onOpenProfile?: () => void;
};

export type SupportersListProps = {
  supporters: SupporterListItem[];
  /** When visibility is count_only, hide names and show this note. */
  privacyNote?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

/**
 * Named supporters roster with privacy placeholder.
 * Do not show names when tenant visibility is count_only — pass privacyNote instead.
 */
export function SupportersList({
  supporters,
  privacyNote,
  emptyTitle = "Todavía no hay apoyos",
  emptyDescription = "Sé el primero en apoyar esta propuesta.",
  className,
}: SupportersListProps) {
  if (privacyNote) {
    return (
      <p
        className={cn(
          "rounded-[14px] bg-[var(--color-surface-muted)] px-4 py-3 text-[14px] leading-5 text-[var(--color-text-secondary)]",
          className,
        )}
      >
        {privacyNote}
      </p>
    );
  }

  if (supporters.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {supporters.map((s) => {
        const row = (
          <>
            <Avatar
              src={s.avatarUrl}
              alt={s.name}
              size="md"
              zoomable={false}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
                {s.name}
              </span>
              {s.whenLabel ? (
                <span className="mt-0.5 block text-[12px] text-[var(--color-text-tertiary)]">
                  {s.whenLabel}
                </span>
              ) : null}
            </span>
          </>
        );

        if (s.onOpenProfile) {
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={s.onOpenProfile}
                className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] px-3 py-2.5 text-left shadow-[var(--shadow-elev-1)]"
              >
                {row}
              </button>
            </li>
          );
        }

        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] px-3 py-2.5 shadow-[var(--shadow-elev-1)]"
          >
            {row}
          </li>
        );
      })}
    </ul>
  );
}
