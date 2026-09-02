"use client";

/**
 * Life Place Sheet — human layer over a Location.
 * Reused from Life Map, Home and Discover. Does not own domain data.
 */

import { useEffect, useMemo, useState } from "react";
import {
  LIVING_PLACE_EMPTY_CTA,
  LIVING_PLACE_CREATE_CTA,
  LIVING_PLACE_EMPTY_DESCRIPTION,
  LIVING_PLACE_EMPTY_TITLE,
  lifePlaceActionLabel,
  lifePlaceAvailabilityLabel,
  lifePlaceNowLabel,
  type LifePlaceAction,
  type LifePlaceContext,
} from "@life-community-os/types";
import {
  fetchPersonalContext,
  togglePersonalFavorite,
} from "@/lib/personal/personal-client";
import { locationCardImageUrl } from "@/lib/location/location-card-asset";
import {
  LIFE_PLACE_MEMBER_ACTION_KINDS,
  visitorConversionLabel,
} from "@/lib/membership/visitor-experience";
import { useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

export type LifePlaceSheetProps = {
  context: LifePlaceContext;
  onAction: (action: LifePlaceAction) => void;
  onClose: () => void;
  onExploreExperiences?: () => void;
  onCreateExperience?: () => void;
  isVisitor?: boolean;
  onJoin?: () => void;
};

export function LifePlaceSheet({
  context,
  onAction,
  onClose,
  onExploreExperiences,
  onCreateExperience,
  isVisitor = false,
  onJoin,
}: LifePlaceSheetProps) {
  const { configuration } = useTenant();
  const { currentUser } = useCurrentUser();
  const [favorite, setFavorite] = useState(false);
  const now = lifePlaceNowLabel(context);
  const availability = lifePlaceAvailabilityLabel(context);
  const lead = context.currentActivity[0];
  const when = formatLifePlaceWhen(lead?.startsAt);
  const identityImage = useMemo(
    () =>
      lead?.metadata?.imageUrl?.trim() ||
      locationCardImageUrl({
        category: context.location.category,
        type: context.location.type as "business",
        imageUrl: undefined,
      }),
    [context.location.category, context.location.type, lead?.metadata?.imageUrl],
  );
  const facilities = context.resources.map((item) => item.name);
  const upcoming = context.experiences.slice(0, 6);
  const hasExperiences =
    context.currentActivity.length > 0 || context.experiences.length > 0;

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

  const primaryActions = context.actions.filter(
    (action) =>
      (action.kind === "join_experience" ||
        action.kind === "reserve_resource" ||
        action.kind === "participate" ||
        action.kind === "navigate" ||
        action.kind === "view_experiences" ||
        action.kind === "create_activity") &&
      (!isVisitor || !LIFE_PLACE_MEMBER_ACTION_KINDS.has(action.kind)),
  );
  const secondaryActions = context.actions.filter(
    (action) =>
      action.kind !== "join_experience" &&
      action.kind !== "reserve_resource" &&
      action.kind !== "participate" &&
      action.kind !== "navigate" &&
      action.kind !== "view_experiences" &&
      action.kind !== "create_activity" &&
      (!isVisitor || !LIFE_PLACE_MEMBER_ACTION_KINDS.has(action.kind)),
  );
  const visitorHasMemberActions = isVisitor
    ? context.actions.some((action) =>
        LIFE_PLACE_MEMBER_ACTION_KINDS.has(action.kind),
      )
    : false;

  return (
    <aside
      className="ui-sheet overflow-hidden rounded-[22px] border border-[var(--color-border-glass)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-2)]"
      aria-label="Información del lugar"
    >
      <div className="relative h-36 overflow-hidden bg-[var(--color-surface-muted)]">
        <img
          src={identityImage}
          alt=""
          className={
            lead?.metadata?.imageUrl?.trim()
              ? "h-full w-full object-cover"
              : "absolute bottom-3 right-4 h-20 w-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
          }
        />
        {lead?.metadata?.imageUrl?.trim() ? (
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

        {context.location.address ? (
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            {context.location.address}
          </p>
        ) : null}

        {context.location.summary ? (
          <p className="mt-2 text-[14px] leading-snug text-[var(--color-text-secondary)]">
            {context.location.summary}
          </p>
        ) : null}

        <section className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            {hasExperiences
              ? context.operations?.status === "important_notice"
                ? "Aviso"
                : context.operations?.status === "reservation_open"
                  ? "Reserva abierta"
                  : context.operations?.status === "upcoming"
                    ? "Próximo"
                    : "Ahora"
              : "Experiencias"}
          </p>
          {context.operations?.status === "important_notice" ? (
            <p className="mt-1 text-[14px] text-[var(--color-text-secondary)]">
              {context.operations.label}
            </p>
          ) : null}
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
            </>
          ) : (
            <>
              {context.operations &&
              context.operations.status !== "available" ? (
                <p className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
                  {context.operations.label}
                </p>
              ) : (
                <>
                  <p className="mt-1 text-[15px] leading-snug text-[var(--color-text-primary)]">
                    {LIVING_PLACE_EMPTY_TITLE}
                  </p>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--color-text-secondary)]">
                    {LIVING_PLACE_EMPTY_DESCRIPTION}
                  </p>
                  {onExploreExperiences ? (
                    <button
                      type="button"
                      onClick={onExploreExperiences}
                      className="ui-press mt-3 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-text-primary)]"
                    >
                      {LIVING_PLACE_EMPTY_CTA}
                    </button>
                  ) : null}
                  {onCreateExperience ? (
                    <button
                      type="button"
                      onClick={onCreateExperience}
                      className="ui-press mt-2 rounded-full bg-[var(--color-action-primary)] px-3.5 py-1.5 text-[13px] font-semibold text-white"
                    >
                      {LIVING_PLACE_CREATE_CTA}
                    </button>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Acciones
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {primaryActions.map((action) => (
              <button
                key={`${action.kind}:${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className={
                  action.kind === "navigate" || action.kind === "view_experiences"
                    ? "ui-press rounded-full border border-[var(--color-border-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-primary)]"
                    : "ui-press rounded-full bg-[var(--color-action-primary)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-on-action)]"
                }
              >
                {action.label || lifePlaceActionLabel(action.kind)}
              </button>
            ))}
            {secondaryActions.map((action) => (
              <button
                key={`${action.kind}:${action.href}`}
                type="button"
                onClick={() => onAction(action)}
                className="ui-press rounded-full border border-[var(--color-border-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                {action.label || lifePlaceActionLabel(action.kind)}
              </button>
            ))}
            {visitorHasMemberActions && onJoin ? (
              <>
                <button
                  type="button"
                  onClick={onJoin}
                  className="ui-press rounded-full bg-[var(--color-action-primary)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-on-action)]"
                >
                  Únete para participar
                </button>
                <button
                  type="button"
                  onClick={onJoin}
                  className="ui-press rounded-full border border-[var(--color-border-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-text-primary)]"
                >
                  Regístrate para reservar
                </button>
              </>
            ) : null}
          </div>
        </section>

        {context.community && !isVisitor ? (
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

        {context.nearbyHelp && context.nearbyHelp.length > 0 && !isVisitor ? (
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
              {isVisitor ? "Actividades públicas" : "Próximas actividades"}
            </h3>
            <ul className="mt-2 space-y-1 text-[14px] text-[var(--color-text-secondary)]">
              {upcoming.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
            {isVisitor && onJoin ? (
              <button
                type="button"
                onClick={onJoin}
                className="ui-press mt-3 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-text-primary)]"
              >
                {visitorConversionLabel(currentUser.authenticated)} para participar
              </button>
            ) : null}
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
