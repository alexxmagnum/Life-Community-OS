"use client";

/**
 * Life Place Sheet — human layer over a Location.
 * Reused from Life Map, Home and Discover. Does not own domain data.
 */

import { useEffect, useState } from "react";
import {
  LIVING_PLACE_EMPTY_CTA,
  LIVING_PLACE_EMPTY_TITLE,
  lifePlaceActionLabel,
  lifePlaceAvailabilityLabel,
  lifePlaceNowLabel,
  type LifePlaceAction,
  type LifePlaceContext,
} from "@life-community-os/types";
import { LIVING_PLACE_GLYPH } from "@/lib/community/composer-glyphs";
import {
  fetchPersonalContext,
  togglePersonalFavorite,
} from "@/lib/personal/personal-client";
import { useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

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
  const { configuration } = useTenant();
  const { currentUser } = useCurrentUser();
  const [favorite, setFavorite] = useState(false);
  const now = lifePlaceNowLabel(context);
  const availability = lifePlaceAvailabilityLabel(context);
  const lead = context.currentActivity[0];
  const when = formatLifePlaceWhen(lead?.startsAt);
  const identityImage = lead?.metadata?.imageUrl?.trim();
  const facilities = context.resources.map((item) => item.name);
  const upcoming = context.experiences.slice(0, 6);

  useEffect(() => {
    if (!currentUser.hasMembership) {
      setFavorite(false);
      return;
    }
    let cancelled = false;
    void fetchPersonalContext({
      tenantId: configuration.tenantId,
      territoryId: context.territoryId,
    }).then((data) => {
      if (cancelled) return;
      setFavorite(
        (data.context?.favoriteLocations ?? []).includes(context.location.id),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    configuration.tenantId,
    context.location.id,
    context.territoryId,
    currentUser.hasMembership,
  ]);
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
      className="ui-sheet overflow-hidden rounded-[22px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-2)]"
      aria-label="Qué puedo hacer aquí"
    >
      <div className="relative h-36 overflow-hidden bg-[var(--color-surface-muted)]">
        <img
          src={identityImage || LIVING_PLACE_GLYPH}
          alt=""
          className={
            identityImage
              ? "h-full w-full object-cover"
              : "absolute bottom-3 right-4 h-20 w-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
          }
        />
        {identityImage ? (
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-surface-elevated)] via-transparent to-black/20" />
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/35 px-3 py-1 text-[13px] font-medium text-white backdrop-blur-[6px]"
        >
          Cerrar
        </button>
      </div>

      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
          {context.location.category}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight text-[var(--color-text-primary)]">
            {context.location.name}
          </h2>
          {currentUser.hasMembership ? (
            <button
              type="button"
              onClick={() => {
                void togglePersonalFavorite({
                  tenantId: configuration.tenantId,
                  kind: "location",
                  targetId: context.location.id,
                }).then((result) => setFavorite(result.saved));
              }}
              className="ui-press shrink-0 rounded-full border border-[var(--color-border-subtle)] px-3 py-1 text-[12px] font-medium text-[var(--color-text-secondary)]"
            >
              {favorite ? "En tus lugares" : "Guardar lugar"}
            </button>
          ) : null}
        </div>

        <section className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Ahora
          </p>
          {now ? (
            <>
              <p className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                {now}
              </p>
              {when ? (
                <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
                  {when}
                </p>
              ) : null}
              {context.community ? (
                <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
                  {context.community.label}
                </p>
              ) : availability ? (
                <p className="mt-1 text-[14px] text-[var(--color-text-tertiary)]">
                  {availability}
                </p>
              ) : null}
              {typeof (lead as { reason?: string } | undefined)?.reason ===
              "string" ? (
                <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
                  Porque: {(lead as { reason?: string }).reason}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-primary)]">
                {LIVING_PLACE_EMPTY_TITLE}
              </p>
              {onCompose ? (
                <button
                  type="button"
                  onClick={onCompose}
                  className="ui-press mt-3 rounded-full bg-[image:var(--gradient-brand)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-text-on-action)]"
                >
                  {LIVING_PLACE_EMPTY_CTA}
                </button>
              ) : null}
            </>
          )}
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Acciones
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {joinOrReserve.map((action) => (
              <button
                key={`${action.kind}:${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className="ui-press rounded-full bg-[var(--color-action-primary)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-on-action)]"
              >
                {action.label || lifePlaceActionLabel(action.kind)}
              </button>
            ))}
            {onCompose && now ? (
              <button
                type="button"
                onClick={onCompose}
                className="ui-press rounded-full border border-[var(--color-border-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                Crear algo aquí
              </button>
            ) : null}
            {otherActions.map((action) => (
              <button
                key={`${action.kind}:${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className="ui-press rounded-full border border-[var(--color-border-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                {action.label || lifePlaceActionLabel(action.kind)}
              </button>
            ))}
          </div>
        </section>

        {context.community ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Quién participa
            </h3>
            <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
              {context.community.label}
            </p>
          </section>
        ) : null}

        {context.business ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Negocio
            </h3>
            <p className="mt-2 text-[14px] font-semibold text-[var(--color-text-primary)]">
              {context.business.name}
            </p>
            {context.business.trustLabel ? (
              <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
                {context.business.trustLabel}
              </p>
            ) : null}
          </section>
        ) : null}

        {context.nearbyProfessionals && context.nearbyProfessionals.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Profesionales cerca
            </h3>
            <ul className="mt-2 space-y-1 text-[14px] text-[var(--color-text-secondary)]">
              {context.nearbyProfessionals.map((item) => (
                <li key={item.id}>
                  {item.name}
                  {item.trustLabel ? ` · ${item.trustLabel}` : ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {context.nearbyHelp && context.nearbyHelp.length > 0 ? (
          <section className="mt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
              Ayuda entre vecinos
            </h3>
            <ul className="mt-2 space-y-1 text-[14px] text-[var(--color-text-secondary)]">
              {context.nearbyHelp.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
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
