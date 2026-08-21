"use client";

import { useEffect, useMemo, useState } from "react";
import { isDemoIdentityEnabled } from "@life-community-os/auth";
import {
  getTerritoryAccessContext,
} from "@life-community-os/tenant-life-panoramica";
import type { DemoRole } from "@life-community-os/tenant-life-panoramica";
import {
  housingAvailabilityLabel,
  housingPropertyTypeLabel,
  propertyMembershipRoleLabel,
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
import { EntityMediaField } from "@/components/media/EntityMediaField";
import { fetchHousingProperties } from "@/lib/housing/housing-client";
import { useEntityMedia } from "@/lib/media/use-entity-media";
import { preferEntityMediaUrl } from "@/lib/media/media-policy";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useCurrentUser } from "@/providers/CurrentUserProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";

const roles: { id: DemoRole; label: string }[] = [
  { id: "member", label: "Miembro" },
  { id: "group_manager", label: "Responsable de grupo" },
  { id: "moderator", label: "Moderador" },
  { id: "administrator", label: "Administrador" },
];

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
    role,
    setRole,
    roleSource,
    demoMember,
    demoMembers,
    demoPersonId,
    setDemoPersonId,
    personId,
    configuration,
  } = useTenant();
  const { joinedExperiences, savedExperiences } = useExperienceParticipation();
  const { upcoming: upcomingReservations } = useReservations();
  const demoIdentity = isDemoIdentityEnabled();
  const [homes, setHomes] = useState<PropertyPublicView[]>([]);
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

  const territoryAccess = useMemo(
    () => getTerritoryAccessContext(demoPersonId),
    [demoPersonId],
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

  const onLocalJoin = async () => {
    const email = `vecino.${Date.now().toString(36)}@life.local`;
    const res = await fetch("/api/auth/local-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName: demoMember.displayName || email.split("@")[0],
      }),
    });
    if (!res.ok) return;
    await refreshSession();
    router.refresh();
  };
  return (
    <MobileScreen dense>
      <ScreenHeader
        title="Mi perfil"
        subtitle="Quién eres en la comunidad."
      />

      <ProfileCard
        name={demoMember.fullName}
        membershipLabel={demoMember.membershipLabel}
        areaLabel={
          homes[0]?.areaLabel ||
          demoMember.areaLabel ||
          theme.identity?.defaultAreaName ||
          placeName
        }
        interests={demoMember.interests}
        avatarUrl={
          uploadedAvatar ||
          preferEntityMediaUrl(avatarMediaUrl, demoMember.avatarUrl)
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

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Mi identidad
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          {demoMember.fullName} · Español
        </p>
        {demoMember.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {demoMember.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-[var(--color-action-primary-subtle)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-action-primary)]"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Aún no has marcado intereses.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Mis viviendas
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
          Mi actividad
        </h2>
        {isFeatureEnabled("experiences") ? (
          <ExploreLink
            label="Experiencias"
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
        {isFeatureEnabled("feed") || isFeatureEnabled("decide") ? (
          <ExploreLink
            label="Comunidad"
            hint="Publicaciones y propuestas"
            onClick={() => router.push("/community")}
          />
        ) : null}
        {isFeatureEnabled("resources") ? (
          <ExploreLink
            label="Mis reservas"
            hint={
              upcomingReservationCount > 0
                ? `${upcomingReservationCount} activas`
                : "Espacios que has reservado"
            }
            onClick={() => router.push("/reservations")}
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
        {isFeatureEnabled("localLife") || isFeatureEnabled("localEntities") ? (
          <ExploreLink
            label="Lugares cerca"
            hint="Sitios del barrio"
            onClick={() => router.push("/discover")}
          />
        ) : null}
      </section>

      {hasCapability(CAPABILITIES.manageEnter) || role === "administrator" ? (
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
                Tu cuenta no pertenece a esta comunidad. El registro o la
                invitación de un administrador te dan acceso.
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
                Comunidad · {currentUser.tenantId} · {currentUser.role}
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
              ) : (
                <button
                  type="button"
                  className="min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
                  onClick={() => void onLocalJoin()}
                >
                  Unirme a la comunidad
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {demoIdentity && roleSource !== "membership"
        ? (
        <>
          <section className="rounded-[14px] border border-dashed border-[var(--color-border-strong)] p-3.5">
            <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
              Probar como…
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              Solo con demo de roles activada. Cambia de persona o permisos.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {demoMembers.map((m) => (
                <button
                  key={m.personId}
                  type="button"
                  onClick={() => setDemoPersonId(m.personId)}
                  className={
                    demoPersonId === m.personId
                      ? "min-h-[36px] rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
                      : "min-h-[36px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
                  }
                >
                  {m.displayName}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[14px] border border-dashed border-[var(--color-border-strong)] p-3.5">
            <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
              Rol de prueba
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              Simula permisos de la comunidad.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={
                    role === r.id
                      ? "min-h-[36px] rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
                      : "min-h-[36px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </MobileScreen>
  );
}
