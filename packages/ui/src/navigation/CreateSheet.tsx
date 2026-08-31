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

/** Optional grouping for contribution hierarchy (D.0.3.1). */
export type CreateActionSection = {
  id: string;
  title: string;
  actions: CreateAction[];
};

export type CreateSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Flat list — used when `sections` is omitted. */
  actions?: CreateAction[];
  /** Preferred: community-value hierarchy. */
  sections?: CreateActionSection[];
  title?: string;
};

export function CreateSheet({
  open,
  onClose,
  actions = [],
  sections,
  title = "Crear en comunidad",
}: CreateSheetProps) {
  if (!open) return null;

  const resolvedSections: CreateActionSection[] =
    sections && sections.length > 0
      ? sections.filter((s) => s.actions.length > 0)
      : actions.length > 0
        ? [{ id: "all", title: "", actions }]
        : [];

  const totalActions = resolvedSections.reduce(
    (n, s) => n + s.actions.length,
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 max-h-[min(88vh,720px)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] bg-[var(--color-surface-elevated)] px-4 pb-8 pt-3 shadow-[var(--shadow-elev-2)] md:rounded-[var(--radius-xl)] md:pb-6",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border-strong)] md:hidden" />
        <h2 className="px-1 text-[22px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 px-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
          ¿Qué quieres aportar a tu comunidad?
        </p>

        {totalActions === 0 ? (
          <p className="px-2 py-8 text-center text-[16px] text-[var(--color-text-secondary)]">
            Ahora no hay nada que aportar
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {resolvedSections.map((section) => (
              <section key={section.id} aria-label={section.title || title}>
                {section.title ? (
                  <h3 className="px-1 pb-1.5 text-[14px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
                    {section.title}
                  </h3>
                ) : null}
                <ul className="space-y-0.5">
                  {section.actions.map((action) => (
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
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
