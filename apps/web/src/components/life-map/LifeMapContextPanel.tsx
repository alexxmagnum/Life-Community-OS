"use client";

/**
 * Digital Twin context card — mundo → objeto → experiencia.
 * No booking backend; prepares domain handoff.
 */

import type { LifeMapActionKind } from "@life-community-os/types";
import type { LifeMapContextPanelModel } from "@life-community-os/life-map-renderer";

export type LifeMapContextPanelProps = {
  model: LifeMapContextPanelModel;
  onAction: (action: LifeMapActionKind) => void;
  onClose: () => void;
  /** Hide technical twin keys in customer demos. */
  customerDemo?: boolean;
};

const ACTION_LABEL: Record<LifeMapActionKind, string> = {
  open: "Abrir ficha",
  navigate: "Cómo llegar",
  message: "Mensaje",
  join: "Unirme",
  reserve: "Reservar (próximamente)",
};

export function LifeMapContextPanel({
  model,
  onAction,
  onClose,
  customerDemo = false,
}: LifeMapContextPanelProps) {
  const tone = model.heroTone ?? "#c4b8a4";

  return (
    <aside
      className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] shadow-sm"
      aria-label="Información del lugar"
    >
      <div
        className="relative h-[120px] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tone} 0%, #f5f1e8 72%)`,
        }}
        aria-hidden
      >
        {model.imageUrl ? (
          // Domain-provided imagery (tenant catalog). Next Image optional later.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={model.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-88"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgba(20,18,14,0.45)_100%)]" />
        {model.experienceTag ? (
          <span className="absolute bottom-3 left-4 rounded-full bg-[rgba(255,255,255,0.88)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
            {model.experienceTag}
          </span>
        ) : null}
      </div>

      <div className="p-4">
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

        {model.asset3DKey && !customerDemo ? (
          <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
            Twin · {model.asset3DKey}
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
      </div>
    </aside>
  );
}
