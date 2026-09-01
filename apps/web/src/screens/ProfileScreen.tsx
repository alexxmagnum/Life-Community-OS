"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTerritoryAccessContext,
} from "@life-community-os/tenant-life-panoramica";
import {
  housingAvailabilityLabel,
  housingPropertyTypeLabel,
  PERSONAL_INTEREST_OPTIONS,
  propertyMembershipRoleLabel,
  type PersonalContext,
  type PersonalFavorite,
  type PropertyPublicView,
} from "@life-community-os/types";
import {
  ExploreLink,
  MobileScreen,
  ProfileCard,
  ScreenHeader,
} from "@life-community-os/ui";
import { useRouter } from "next/navigation";
import { TerritoryBelongingCard } from "@/components/TerritoryBelongingCard";
import { JoinCommunityPanel } from "@/components/membership/JoinCommunityPanel";
import { profileMembershipLabel } from "@/lib/membership/join-community-experience";
import { EntityMediaField } from "@/components/media/EntityMediaField";
import { fetchHousingProperties } from "@/lib/housing/housing-client";
import { useEntityMedia } from "@/lib/media/use-entity-media";
import { preferEntityMediaUrl } from "@/lib/media/media-policy";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";
import { useTerritory } from "@/providers/TerritoryProvider";
import type { CommunityOwnActivity, TrustContext } from "@life-community-os/types";
import { ownTrustContribution } from "@life-community-os/types";
import {
  fetchPersonalContext,
  patchPersonalContext,
} from "@/lib/personal/personal-client";
import {
  fetchTrustContext,
  patchTrustPrivacy,
} from "@/lib/trust/trust-client";
import { fetchOwnGovernance } from "@/lib/governance/governance-client";
import type {
  GovernancePersonBlock,
  PublicGovernanceReport,
} from "@life-community-os/types";

/**
 * Mi perfil — identity, preferences, personal context.
 * Property info only where useful for belonging — never real-estate catalog.
 */
export function ProfileScreen() {
  const router = useRouter();
  const { currentUser, refreshSession } = useCurrentUser();
  const {
    theme,
    hasCapability,
    isFeatureEnabled,
    personId,
    configuration,
  } = useTenant();
  const { joinedExperiences, savedExperiences } = useExperienceParticipation();
  const { upcoming: upcomingReservations } = useReservations();
  const { context: activeTerritory } = useTerritory();
  const [homes, setHomes] = useState<PropertyPublicView[]>([]);
  const [ownActivity, setOwnActivity] = useState<CommunityOwnActivity | null>(
    null,
  );
  const [personal, setPersonal] = useState<PersonalContext | null>(null);
  const [trust, setTrust] = useState<TrustContext | null>(null);
  const [ownReports, setOwnReports] = useState<PublicGovernanceReport[]>([]);
  const [ownBlocks, setOwnBlocks] = useState<GovernancePersonBlock[]>([]);
  const [favorites, setFavorites] = useState<PersonalFavorite[]>([]);
  const { coverUrl: avatarMediaUrl } = useEntityMedia("profile", personId);
  const [uploadedAvatar, setUploadedAvatar] = useState<string | undefined>();

  const upcomingExperienceCount = joinedExperiences.filter(
    (e) => e.status !== "cancelled" && e.status !== "expired",
  ).length;
  const upcomingReservationCount = upcomingReservations.length;
  const savedExperienceCount = savedExperiences.length;

  useEffect(() => {
    if (!personId) {
      setHomes([]);
      return;
    }
    let cancelled = false;
    void fetchHousingProperties({
      tenantId: configuration.tenantId,
      mine: true,
    }).then((rows) => {
      if (!cancelled) setHomes(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [personId, configuration.tenantId]);

  useEffect(() => {
    if (!personId) {
      setOwnActivity(null);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/community/activity?tenantId=${encodeURIComponent(configuration.tenantId)}`,
      {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-tenant-slug": configuration.tenantId },
      },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { activity?: CommunityOwnActivity } | null) => {
        if (!cancelled) setOwnActivity(data?.activity ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [personId, configuration.tenantId]);

  useEffect(() => {
    if (!personId) {
      setPersonal(null);
      setFavorites([]);
      setTrust(null);
      setOwnReports([]);
      setOwnBlocks([]);
      return;
    }
    let cancelled = false;
    void fetchPersonalContext({
      tenantId: configuration.tenantId,
      territoryId: activeTerritory.territoryId,
    }).then((data) => {
      if (cancelled) return;
      setPersonal(data.context);
      setFavorites(data.favorites);
    });
    void fetchTrustContext({
      tenantId: configuration.tenantId,
      territoryId: activeTerritory.territoryId,
    }).then((context) => {
      if (!cancelled) setTrust(context);
    });
    void fetchOwnGovernance({
      tenantId: configuration.tenantId,
      territoryId: activeTerritory.territoryId,
    }).then((mine) => {
      if (cancelled) return;
      setOwnReports(mine.reports);
      setOwnBlocks(mine.blocks);
    });
    return () => {
      cancelled = true;
    };
  }, [personId, configuration.tenantId, activeTerritory.territoryId]);

  const territoryAccess = useMemo(
    () => getTerritoryAccessContext(personId ?? ""),
    [personId],
  );

  const placeName =
    theme.identity?.territoryName ?? theme.logoText ?? "Tu comunidad";

  const session = {
    configured: currentUser.configured,
    authenticated: currentUser.authenticated,
    user: currentUser.userId
      ? { id: currentUser.userId, email: currentUser.email }
      : null,
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshSession();
    router.refresh();
  };

  return (
    <MobileScreen dense>
      <ScreenHeader
        title="Mi vida aquí"
        subtitle="Lo que has creado, en lo que has participado y dónde has ayudado."
      />

      <ProfileCard
        name={currentUser.displayName || currentUser.email?.split("@")[0] || "Vecino"}
        membershipLabel={profileMembershipLabel({
          authenticated: currentUser.authenticated,
          hasMembership: currentUser.hasMembership,
          membershipStatus: currentUser.membershipStatus,
          role: currentUser.role,
        })}
        areaLabel={
          homes[0]?.areaLabel ||
          theme.identity?.defaultAreaName ||
          placeName
        }
        interests={(personal?.preferences.interests ?? []).map(
          (id) =>
            PERSONAL_INTEREST_OPTIONS.find((option) => option.id === id)
              ?.label ?? id,
        )}
        avatarUrl={
          uploadedAvatar ||
          preferEntityMediaUrl(avatarMediaUrl, undefined)
        }
      />

      {personId ? (
        <EntityMediaField
          entityType="profile"
          entityId={personId}
          purpose="avatar"
          type="avatar"
          label="Cambiar avatar"
          onUploaded={(_id, url) => setUploadedAvatar(url)}
        />
      ) : null}

      <JoinCommunityPanel onJoined={() => void refreshSession()} />

      {personId ? (
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Mis intereses
          </h2>
          <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
            Tú eliges. Esto solo ordena lo que ya ocurre en tu territorio.
          </p>
          <div className="flex flex-wrap gap-2">
            {PERSONAL_INTEREST_OPTIONS.map((option) => {
              const selected = personal?.preferences.interests.includes(
                option.id,
              );
              return (
                <button
                  key={option.id}
                  type="button"
                  className={
                    selected
                      ? "rounded-full bg-[var(--color-action-primary)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-on-action)]"
                      : "rounded-full border border-[var(--color-border-subtle)] px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)]"
                  }
                  onClick={() => {
                    const current = personal?.preferences.interests ?? [];
                    const next = selected
                      ? current.filter((id) => id !== option.id)
                      : [...current, option.id];
                    void patchPersonalContext({
                      tenantId: configuration.tenantId,
                      interests: next,
                    }).then((context) => {
                      if (context) setPersonal(context);
                    });
                  }}
                >
                  {option.emoji} {option.label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={personal?.privacy.receiveRecommendations !== false}
              onChange={(event) => {
                void patchPersonalContext({
                  tenantId: configuration.tenantId,
                  privacy: {
                    receiveRecommendations: event.target.checked,
                  },
                }).then((context) => {
                  if (context) setPersonal(context);
                });
              }}
            />
            Recibir recomendaciones
          </label>
          <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={personal?.privacy.shareActivity !== false}
              onChange={(event) => {
                void patchPersonalContext({
                  tenantId: configuration.tenantId,
                  privacy: { shareActivity: event.target.checked },
                }).then((context) => {
                  if (context) setPersonal(context);
                });
              }}
            />
            Aparecer en actividad
          </label>
        </section>
      ) : null}

      {favorites.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Mis favoritos
          </h2>
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Privados. No son seguidores.
          </p>
          {favorites.map((item) => (
            <p
              key={item.id}
              className="text-[14px] text-[var(--color-text-secondary)]"
            >
              {item.kind === "location"
                ? "Lugar"
                : item.kind === "experience"
                  ? "Actividad"
                  : item.kind === "business"
                    ? "Negocio"
                    : "Recurso"}
              : guardado
            </p>
          ))}
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Mi identidad
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          {currentUser.displayName || currentUser.email?.split("@")[0] || "Invitado"} · Español
        </p>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {(personal?.preferences.interests.length ?? 0) > 0
            ? "Tus intereses son privados. Solo ordenan lo que ves."
            : "Aún no has marcado intereses."}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Mis lugares
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Tu relación con el hogar. No mostramos viviendas de otros vecinos.
        </p>
        {homes.length === 0 ? (
          <div className="rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 shadow-[var(--shadow-elev-1)]">
            <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              Sin vivienda vinculada
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              Cuando registres un hogar o te añadan como residente, aparecerá
              aquí.
            </p>
            {hasCapability(CAPABILITIES.housingView) ? (
              <button
                type="button"
                onClick={() => router.push("/housing")}
                className="mt-3 text-[13px] font-semibold text-[var(--color-action-primary)]"
              >
                Ir a Vivienda
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            {homes.map((home) => (
              <button
                key={home.id}
                type="button"
                onClick={() => router.push(`/housing/${home.id}`)}
                className="w-full rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 text-left shadow-[var(--shadow-elev-1)]"
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {home.viewerRole
                    ? propertyMembershipRoleLabel(
                        home.viewerRole as
                          | "owner"
                          | "resident"
                          | "tenant"
                          | "family_member",
                      )
                    : housingPropertyTypeLabel(home.propertyType)}
                </p>
                <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                  {home.title}
                </p>
                <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
                  {[
                    home.areaLabel,
                    housingAvailabilityLabel(home.availability),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <TerritoryBelongingCard access={territoryAccess} />

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Mi contribución
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Privado por defecto. No es un muro público ni un ranking.
        </p>
        {(trust ? ownTrustContribution(trust.signals) : []).length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Todavía no hay aportaciones en este territorio.
          </p>
        ) : (
          (trust ? ownTrustContribution(trust.signals) : []).map((line) => (
            <p
              key={line.title}
              className="rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 shadow-[var(--shadow-elev-1)]"
            >
              <span className="block text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                {line.title}
              </span>
              <span className="mt-1 block text-[16px] font-semibold text-[var(--color-text-primary)]">
                {line.detail}
              </span>
            </p>
          ))
        )}
        <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={trust?.privacy.visible === true}
            onChange={(event) => {
              void patchTrustPrivacy({
                tenantId: configuration.tenantId,
                privacy: { visible: event.target.checked },
              }).then((context) => {
                if (context) setTrust(context);
              });
            }}
          />
          Dejar ver que participo
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={trust?.privacy.showSignals === true}
            onChange={(event) => {
              void patchTrustPrivacy({
                tenantId: configuration.tenantId,
                privacy: { showSignals: event.target.checked },
              }).then((context) => {
                if (context) setTrust(context);
              });
            }}
          />
          Mostrar señales de confianza
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Cuidado de la comunidad
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Privado. No hay historial público de conflictos.
        </p>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Mis reportes enviados
        </p>
        {ownReports.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No has enviado avisos en este territorio.
          </p>
        ) : (
          ownReports.map((item) => (
            <p
              key={item.id}
              className="rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 text-[13px] shadow-[var(--shadow-elev-1)]"
            >
              {item.entityType} · {item.reason} · {item.status}
            </p>
          ))
        )}
        <p className="pt-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Mis bloqueos
        </p>
        {ownBlocks.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No has bloqueado a nadie en este territorio.
          </p>
        ) : (
          ownBlocks.map((item) => (
            <p
              key={item.id}
              className="rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 text-[13px] shadow-[var(--shadow-elev-1)]"
            >
              Bloqueo territorial
            </p>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Mi vida aquí
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Solo tú ves esto. No es un muro público.
        </p>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          He creado
        </p>
        {ownActivity?.experiencesCreated[0] ? (
          <ExploreLink
            label="Experiencias"
            hint={ownActivity.experiencesCreated[0].title}
            onClick={() => router.push(ownActivity.experiencesCreated[0]!.href)}
          />
        ) : null}
        {ownActivity?.upcomingEvents[0] ? (
          <ExploreLink
            label="Eventos"
            hint={ownActivity.upcomingEvents[0].title}
            onClick={() => router.push("/community")}
          />
        ) : null}
        {!ownActivity?.experiencesCreated[0] && !ownActivity?.upcomingEvents[0] ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Todavía no has creado planes.
          </p>
        ) : null}
        <p className="pt-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          He participado
        </p>
        {isFeatureEnabled("experiences") ? (
          <ExploreLink
            label="Actividades"
            hint={
              upcomingExperienceCount > 0
                ? `${upcomingExperienceCount} próximas`
                : "Tu agenda de experiencias"
            }
            onClick={() => router.push("/calendar")}
          />
        ) : null}
        {isFeatureEnabled("groups") ? (
          <ExploreLink
            label="Grupos"
            hint="Dónde participas"
            onClick={() => router.push("/community?tab=grupos")}
          />
        ) : null}
        {isFeatureEnabled("resources") ? (
          <ExploreLink
            label="Reservas"
            hint={
              upcomingReservationCount > 0
                ? `${upcomingReservationCount} activas`
                : "Espacios que has reservado"
            }
            onClick={() => router.push("/reservations")}
          />
        ) : null}
        <p className="pt-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          He ayudado
        </p>
        {ownActivity?.helpOffered[0] ? (
          <ExploreLink
            label="Vecinos"
            hint={ownActivity.helpOffered[0].title}
            onClick={() => router.push(ownActivity.helpOffered[0]!.href)}
          />
        ) : (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Todavía no has ofrecido ayuda.
          </p>
        )}
        <p className="pt-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Mis reservas
        </p>
        {ownActivity?.upcomingReservations[0] ? (
          <ExploreLink
            label="Reservas"
            hint={ownActivity.upcomingReservations[0].title}
            onClick={() => router.push("/reservations")}
          />
        ) : (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No tienes reservas próximas.
          </p>
        )}
        <p className="pt-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Mis lugares
        </p>
        <ExploreLink
          label="Lugares guardados"
          hint="Solo tú ves esta lista"
          onClick={() => router.push("/map")}
        />
        {isFeatureEnabled("feed") || isFeatureEnabled("decide") ? (
          <ExploreLink
            label="Comunidad"
            hint="Vida de tu territorio"
            onClick={() => router.push("/community")}
          />
        ) : null}
        {isFeatureEnabled("experiences") ? (
          <ExploreLink
            label="Experiencias guardadas"
            hint={
              savedExperienceCount > 0
                ? `${savedExperienceCount} guardadas`
                : "Las que has marcado"
            }
            onClick={() => router.push("/experiences?saved=1")}
          />
        ) : null}
        {isFeatureEnabled("incidents") ? (
          <ExploreLink
            label="Mis avisos"
            hint="Seguimiento de lo que has enviado"
            onClick={() => router.push("/report?view=mine")}
          />
        ) : null}
        <ExploreLink
          label="Mensajes"
          hint="Conversaciones de la comunidad"
          onClick={() => router.push("/messages")}
        />
        <ExploreLink
          label="Notificaciones"
          hint="Lo que necesita tu atención"
          onClick={() => router.push("/notifications")}
        />
        <p className="pt-2 text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Privacidad: puedes ocultar tu nombre en listas, rechazar invitaciones
          y no mostrar tu actividad.
        </p>
        {isFeatureEnabled("localLife") || isFeatureEnabled("localEntities") ? (
          <ExploreLink
            label="Lugares cerca"
            hint="Sitios del barrio"
            onClick={() => router.push("/discover")}
          />
        ) : null}
      </section>

      {hasCapability(CAPABILITIES.manageEnter) ? (
        <p className="rounded-[14px] bg-[var(--color-surface-muted)] px-3.5 py-3 text-[13px] leading-5 text-[var(--color-text-secondary)]">
          Tienes permisos de administración.{" "}
          <button
            type="button"
            className="font-semibold text-[var(--color-action-primary)]"
            onClick={() => router.push("/admin")}
          >
            Abrir panel
          </button>
        </p>
      ) : null}

      <section className="rounded-[14px] border border-[var(--color-border-subtle)] p-3.5">
        <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
          Cuenta
        </p>
        {session.authenticated && session.user ? (
          <>
            <p className="mt-1 text-[14px] text-[var(--color-text-primary)]">
              {session.user.email ?? session.user.id}
            </p>
            {!currentUser.hasMembership ? (
              <p className="mt-2 text-[13px] text-[var(--color-warning)]">
                {profileMembershipLabel({
                  authenticated: currentUser.authenticated,
                  hasMembership: currentUser.hasMembership,
                  membershipStatus: currentUser.membershipStatus,
                  role: currentUser.role,
                })}
                . Únete con tu código desde el panel superior o pide una
                invitación a un administrador.
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
                Comunidad · {currentUser.tenantId} ·{" "}
                {profileMembershipLabel({
                  authenticated: currentUser.authenticated,
                  hasMembership: currentUser.hasMembership,
                  membershipStatus: currentUser.membershipStatus,
                  role: currentUser.role,
                })}
              </p>
            )}
            <button
              type="button"
              className="mt-3 min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--color-text-secondary)]"
              onClick={() => void onLogout()}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
              {session?.configured
                ? "Inicia sesión para sincronizar tu comunidad."
                : "Únete a esta comunidad. El primer miembro puede administrar el espacio."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {session?.configured ? (
                <>
                  <button
                    type="button"
                    className="min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
                    onClick={() => router.push("/login")}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    className="min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--color-text-secondary)]"
                    onClick={() => router.push("/register")}
                  >
                    Crear cuenta
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}
      </section>

    </MobileScreen>
  );
}
