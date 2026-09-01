"use client";

import type { ReactNode } from "react";

import { staggerItemProps } from "../interaction";
import { cn } from "../lib/cn";

export type CreateAction = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  onSelect: () => void;
  hint?: string;
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
  /** Optional place line, e.g. "En Piscina". */
  contextLine?: string;
  subtitle?: string;
  emptyMessage?: string;
};

export function CreateSheet({
  open,
  onClose,
  actions = [],
  sections,
  title = "¿Qué quieres aportar?",
  contextLine,
  subtitle = "Comparte algo que haga mejor tu comunidad",
  emptyMessage = "Ahora no hay nada que aportar",
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
        className="ui-fade ui-backdrop absolute inset-0"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "ui-sheet relative z-10 max-h-[min(88vh,720px)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-xl)] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)]/92 px-4 pb-8 pt-3 shadow-[var(--shadow-elev-2)] backdrop-blur-xl md:rounded-[var(--radius-xl)] md:pb-6",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--color-border-strong)] md:hidden" />
        <h2 className="px-1 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-7 text-[var(--color-text-primary)]">
          {title}
        </h2>
        {contextLine ? (
          <p className="mt-1 px-1 text-[14px] font-medium text-[var(--color-action-primary)]">
            {contextLine}
          </p>
        ) : null}
        {subtitle ? (
          <p className="mt-1 px-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        ) : null}

        {totalActions === 0 ? (
          <p className="px-2 py-8 text-center text-[16px] text-[var(--color-text-secondary)]">
            {emptyMessage}
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            {resolvedSections.map((section) => (
              <section key={section.id} aria-label={section.title || title}>
                {section.title ? (
                  <h3 className="px-1 pb-1.5 text-[14px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
                    {section.title}
                  </h3>
                ) : null}
                <ul className="space-y-2">
                  {section.actions.map((action, index) => {
                    const stagger = staggerItemProps(index);
                    return (
                    <li
                      key={action.id}
                      className={stagger.className}
                      data-stagger-index={stagger["data-stagger-index"]}
                    >
                      <button
                        type="button"
                        className="ui-press flex min-h-[64px] w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/40 px-3 py-3 text-left transition-colors hover:bg-[var(--color-surface-muted)]"
                        onClick={() => {
                          action.onSelect();
                          onClose();
                        }}
                      >
                        <span
                          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[var(--color-surface-elevated)] text-lg shadow-[var(--shadow-elev-1)]"
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
                          {action.hint ? (
                            <span className="mt-1 block text-[12px] text-[var(--color-text-tertiary)]">
                              {action.hint}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
