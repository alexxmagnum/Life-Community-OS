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
  message: "Contactar",
  join: "Unirme",
  reserve: "Reservar",
};

function actionLabel(
  action: LifeMapActionKind,
  type: LifeMapContextPanelModel["type"],
): string {
  if (action === "open") {
    if (type === "place") return "Ver negocio";
    if (type === "housing") return "Información pública";
    if (type === "decoration") return "Información comunidad";
    if (type === "resource") return "Ver instalación";
  }
  return ACTION_LABEL[action] ?? action;
}

const PRIMARY_ACTIONS = new Set<LifeMapActionKind>(["open", "navigate", "reserve", "join"]);
const HIDDEN_DEMO_ACTIONS = new Set<LifeMapActionKind>([]);

export function LifeMapContextPanel({
  model,
  onAction,
  onClose,
  customerDemo = false,
}: LifeMapContextPanelProps) {
  const tone = model.heroTone ?? "#c4b8a4";

  return (
    <aside
      className="mt-4 overflow-hidden rounded-[20px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] shadow-[0_16px_48px_rgba(28,24,18,0.12)]"
      aria-label="Información del lugar"
    >
      <div
        className="relative h-[148px] w-full overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${tone} 0%, #1c1a16 118%)`,
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
        ) : (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(0,0,0,0.25), transparent 50%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_15%,rgba(16,14,12,0.72)_100%)]" />
        {model.experienceTag ? (
          <span className="absolute bottom-3 left-4 rounded-full bg-[rgba(255,255,255,0.92)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
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
            <h2 className="mt-1 text-[20px] font-semibold leading-tight text-[var(--color-text-primary)]">
              {model.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[13px] text-[var(--color-text-tertiary)] underline-offset-2 hover:underline"
          >
            Cerrar
          </button>
        </div>

        {model.address ? (
          <p className="mt-2 text-[13px] leading-snug text-[var(--color-text-tertiary)]">
            {model.address}
          </p>
        ) : null}

        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {model.summary}
        </p>

        {model.liveNow ? (
          <div className="mt-3 rounded-2xl bg-[var(--color-surface-muted,rgba(28,24,18,0.04))] px-3 py-2.5">
            <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
              {model.liveNow}
            </p>
            {model.liveAvailability ? (
              <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                {model.liveAvailability}
              </p>
            ) : null}
          </div>
        ) : null}

        {model.asset3DKey && !customerDemo ? (
          <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
            Twin · {model.asset3DKey}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {model.availableActions
            .filter((action) => !(customerDemo && HIDDEN_DEMO_ACTIONS.has(action)))
            .map((action) => {
            const isPrimary = PRIMARY_ACTIONS.has(action);
            return (
              <button
                key={action}
                type="button"
                onClick={() => onAction(action)}
                className={
                  isPrimary
                    ? "rounded-full bg-[var(--color-action-primary,#1a5c56)] px-3.5 py-1.5 text-[13px] font-medium text-white"
                    : "rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
                }
              >
                {actionLabel(action, model.type)}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
