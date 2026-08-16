"use client";

/**
 * Digital Twin context panel — selection → contextual actions.
 * No booking logic; prepares domain handoff via LifeMapInteraction.
 */

import type { LifeMapActionKind } from "@life-community-os/types";
import type { LifeMapContextPanelModel } from "@life-community-os/life-map-renderer";

export type LifeMapContextPanelProps = {
  model: LifeMapContextPanelModel;
  onAction: (action: LifeMapActionKind) => void;
  onClose: () => void;
};

const ACTION_LABEL: Record<LifeMapActionKind, string> = {
  open: "Abrir",
  navigate: "Cómo llegar",
  message: "Mensaje",
  join: "Unirme",
  reserve: "Reservar (próximamente)",
};

export function LifeMapContextPanel({
  model,
  onAction,
  onClose,
}: LifeMapContextPanelProps) {
  return (
    <aside
      className="mt-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] p-4 shadow-sm"
      aria-label="Contexto del objeto espacial"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            {model.categoryHint}
          </p>
          <h2 className="mt-1 text-[18px] font-semibold text-[var(--color-text-primary)]">
            {model.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] text-[var(--color-text-tertiary)] underline-offset-2 hover:underline"
        >
          Cerrar
        </button>
      </div>

      <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {model.summary}
      </p>

      {model.asset3DKey ? (
        <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
          Asset · {model.asset3DKey}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {model.availableActions.map((action) => {
          const isFuture = action === "reserve";
          return (
            <button
              key={action}
              type="button"
              disabled={isFuture}
              onClick={() => onAction(action)}
              className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {ACTION_LABEL[action] ?? action}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
