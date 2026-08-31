"use client";

/**
 * Life Place Sheet — human layer over a Location.
 * Reused from Life Map, Home and Discover. Does not own domain data.
 */

import {
  LIVING_EMPTY_CTA,
  LIVING_EMPTY_TITLE,
  lifePlaceActionLabel,
  lifePlaceAvailabilityLabel,
  lifePlaceNowLabel,
  type LifePlaceAction,
  type LifePlaceContext,
} from "@life-community-os/types";

export type LifePlaceSheetProps = {
  context: LifePlaceContext;
  onAction: (action: LifePlaceAction) => void;
  onClose: () => void;
  onCompose?: () => void;
};

export function LifePlaceSheet({
  context,
  onAction,
  onClose,
  onCompose,
}: LifePlaceSheetProps) {
  const now = lifePlaceNowLabel(context);
  const availability = lifePlaceAvailabilityLabel(context);
  const when = formatLifePlaceWhen(context.currentActivity[0]?.startsAt);
  const facilities = context.resources.map((item) => item.name);
  const upcoming = context.experiences.slice(0, 6);
  const joinOrReserve = context.actions.filter(
    (action) =>
      action.kind === "join_experience" ||
      action.kind === "reserve_resource" ||
      action.kind === "participate",
  );
  const otherActions = context.actions.filter(
    (action) =>
      action.kind !== "join_experience" &&
      action.kind !== "reserve_resource" &&
      action.kind !== "participate" &&
      action.kind !== "create_activity",
  );

  return (
    <aside
      className="ui-pop mt-4 overflow-hidden rounded-[20px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated,#fff)] shadow-[0_16px_48px_rgba(28,24,18,0.12)]"
      aria-label="Qué puedo hacer aquí"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              {context.location.category}
            </p>
            <h2 className="mt-1 text-[20px] font-semibold leading-tight text-[var(--color-text-primary)]">
              {context.location.name}
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

        {context.location.address ? (
          <p className="mt-2 text-[13px] leading-snug text-[var(--color-text-tertiary)]">
            {context.location.address}
          </p>
        ) : null}

        <section className="mt-4 rounded-2xl bg-[var(--color-surface-muted,rgba(28,24,18,0.04))] px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Ahora
          </p>
          {now ? (
            <>
              <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                {now}
              </p>
              {when ? (
                <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                  {when}
                </p>
              ) : null}
              {context.community ? (
                <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
                  {context.community.label}
                </p>
              ) : availability ? (
                <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                  {availability}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 text-[15px] font-medium text-[var(--color-text-primary)]">
                {LIVING_EMPTY_TITLE}
              </p>
              {onCompose ? (
                <button
                  type="button"
                  onClick={onCompose}
                  className="mt-2 text-[13px] font-semibold text-[var(--color-action-primary)]"
                >
                  {LIVING_EMPTY_CTA}
                </button>
              ) : null}
            </>
          )}
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Qué puedo hacer
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {joinOrReserve.map((action) => (
              <button
                key={`${action.kind}:${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-full bg-[var(--color-action-primary,#1a5c56)] px-3.5 py-1.5 text-[13px] font-medium text-white"
              >
                {action.label || lifePlaceActionLabel(action.kind)}
              </button>
            ))}
            {onCompose ? (
              <button
                type="button"
                onClick={onCompose}
                className="rounded-full bg-[image:var(--gradient-brand)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-on-action)]"
              >
                Crear algo aquí
              </button>
            ) : null}
            {otherActions.map((action) => (
              <button
                key={`${action.kind}:${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className="rounded-full border border-[var(--color-border-subtle)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                {action.label || lifePlaceActionLabel(action.kind)}
              </button>
            ))}
          </div>
        </section>

        {context.community && now ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Quién participa
            </h3>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
              {context.community.label}
            </p>
          </section>
        ) : null}

        {facilities.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Instalaciones
            </h3>
            <ul className="mt-2 space-y-1 text-[14px] text-[var(--color-text-secondary)]">
              {facilities.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {context.location.hours ? (
          <p className="mt-3 text-[13px] text-[var(--color-text-tertiary)]">
            Horario: {context.location.hours}
          </p>
        ) : null}

        {upcoming.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Próximas actividades
            </h3>
            <ul className="mt-2 space-y-1 text-[14px] text-[var(--color-text-secondary)]">
              {upcoming.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function formatLifePlaceWhen(startsAt?: string): string | undefined {
  if (!startsAt?.trim()) return undefined;
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
