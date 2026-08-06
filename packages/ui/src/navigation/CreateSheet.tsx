"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export type CreateAction = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  onSelect: () => void;
};

export type CreateSheetProps = {
  open: boolean;
  onClose: () => void;
  actions: CreateAction[];
  title?: string;
};

export function CreateSheet({
  open,
  onClose,
  actions,
  title = "Create",
}: CreateSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-[var(--radius-xl)] bg-[var(--color-surface-elevated)] px-4 pb-8 pt-3 shadow-[var(--shadow-elev-2)] md:rounded-[var(--radius-xl)] md:pb-6",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border-strong)] md:hidden" />
        <h2 className="px-1 text-[22px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <ul className="mt-4 space-y-1">
          {actions.length === 0 ? (
            <li className="px-2 py-6 text-center text-[16px] text-[var(--color-text-secondary)]">
              Nothing to create right now
            </li>
          ) : (
            actions.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  className="flex min-h-[56px] w-full items-start gap-3 rounded-[var(--radius-md)] px-2 py-3 text-left transition-colors hover:bg-[var(--color-surface-muted)]"
                  onClick={() => {
                    action.onSelect();
                    onClose();
                  }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary-subtle)] text-lg text-[var(--color-action-primary)]"
                    aria-hidden
                  >
                    {action.icon}
                  </span>
                  <span>
                    <span className="block text-[17px] font-semibold text-[var(--color-text-primary)]">
                      {action.title}
                    </span>
                    <span className="mt-0.5 block text-[14px] text-[var(--color-text-secondary)]">
                      {action.description}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
