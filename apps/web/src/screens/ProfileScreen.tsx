"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMyHomeContext,
  getTerritoryAccessContext,
  residencyDemoNarratives,
} from "@life-community-os/tenant-life-panoramica";
import type { DemoRole } from "@life-community-os/tenant-life-panoramica";
import {
  ExploreLink,
  MobileScreen,
  ProfileCard,
  ScreenHeader,
} from "@life-community-os/ui";
import { useRouter } from "next/navigation";
import { TerritoryBelongingCard } from "@/components/TerritoryBelongingCard";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import { useExperienceParticipation } from "@/providers/ExperienceParticipationProvider";
import { useReservations } from "@/providers/ReservationProvider";

const roles: { id: DemoRole; label: string }[] = [
  { id: "member", label: "Miembro" },
  { id: "group_manager", label: "Responsable de grupo" },
  { id: "moderator", label: "Moderador" },
  { id: "administrator", label: "Administrador" },
];

type SessionState = {
  configured: boolean;
  authenticated: boolean;
  user: { id: string; email: string | null } | null;
};

/**
 * Mi perfil — identity, preferences, personal context.
 * Property info only where useful for belonging — never real-estate catalog.
 */
export function ProfileScreen() {
  const router = useRouter();
  const {
    theme,
    hasCapability,
    isFeatureEnabled,
    role,
    setRole,
    demoMember,
    demoMembers,
    demoPersonId,
    setDemoPersonId,
  } = useTenant();
  const { joinedExperiences, savedExperiences } = useExperienceParticipation();
  const { upcoming: upcomingReservations } = useReservations();
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await res.json()) as SessionState;
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) {
          setSession({
            configured: false,
            authenticated: false,
            user: null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingExperienceCount = joinedExperiences.filter(
    (e) => e.status !== "cancelled" && e.status !== "expired",
  ).length;
  const upcomingReservationCount = upcomingReservations.length;
  const savedExperienceCount = savedExperiences.length;

  const home = useMemo(() => getMyHomeContext(demoPersonId), [demoPersonId]);
  const primary = home.primary;
  const territoryAccess = useMemo(
    () => getTerritoryAccessContext(demoPersonId),
    [demoPersonId],
  );

  const narrative =
    residencyDemoNarratives[demoMember.narrativeKey]?.summary ??
    home.emptyMessage;

  const residencyTone =
    primary?.statusKind === "verified"
      ? "text-[var(--color-success)]"
      : primary?.statusKind === "pending"
        ? "text-[var(--color-warning)]"
        : demoMember.residencyStatusKind === "verified"
          ? "text-[var(--color-success)]"
          : demoMember.residencyStatusKind === "pending"
            ? "text-[var(--color-warning)]"
            : "text-[var(--color-action-primary)]";

  const placeName =
    theme.identity?.territoryName ?? theme.logoText ?? "Tu comunidad";

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({
      configured: session?.configured ?? false,
      authenticated: false,
      user: null,
    });
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
          primary?.communityAreaLabel ||
          demoMember.areaLabel ||
          theme.identity?.defaultAreaName ||
          placeName
        }
        interests={demoMember.interests}
        avatarUrl={demoMember.avatarUrl}
      />

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
          Mi hogar
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Tu vínculo con la comunidad — no es un catálogo de viviendas.
        </p>
        {primary ? (
          <div className="rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 shadow-[var(--shadow-elev-1)]">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              {primary.relationshipLabel}
            </p>
            <p className="mt-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
              {primary.headline}
            </p>
            {primary.property.name || primary.address.line1 ? (
              <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
                {primary.property.name ?? primary.address.line1}
              </p>
            ) : null}
            <p className={`mt-2 text-[14px] font-semibold ${residencyTone}`}>
              {primary.statusLabel}
            </p>
            <div className="mt-2 space-y-0.5 text-[13px] text-[var(--color-text-secondary)]">
              {primary.communityAreaLabel ? (
                <p>
                  Zona ·{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {primary.communityAreaLabel}
                  </span>
                </p>
              ) : null}
              <p>
                Comunidad ·{" "}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {placeName}
                </span>
              </p>
              {primary.grantsResidencyAccess ? (
                <p className="text-[var(--color-success)]">
                  Zona verificada · disponible para ti.
                </p>
              ) : primary.statusKind === "pending" ? (
                <p className="text-[var(--color-warning)]">
                  Pendiente de verificación — aún no se abren espacios de zona.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-[14px] bg-[var(--color-surface-elevated)] p-3.5 shadow-[var(--shadow-elev-1)]">
            <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              Sin hogar vinculado
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              {home.emptyMessage}
            </p>
            <p className={`mt-2 text-[13px] font-semibold ${residencyTone}`}>
              {demoMember.residencyStatusLabel}
            </p>
          </div>
        )}
        {home.homes.length > 1 ? (
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-[var(--color-text-tertiary)]">
              Otros vínculos
            </p>
            {home.homes.slice(1).map((entry) => (
              <div
                key={entry.relationship.id}
                className="rounded-[14px] bg-[var(--color-surface-elevated)] px-3.5 py-2.5 shadow-[var(--shadow-elev-1)]"
              >
                <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                  {entry.headline}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
                  {entry.relationshipLabel} · {entry.statusLabel}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <p className="text-[12px] leading-5 text-[var(--color-text-tertiary)]">
          {narrative}
        </p>
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
        {session?.authenticated && session.user ? (
          <>
            <p className="mt-1 text-[14px] text-[var(--color-text-primary)]">
              {session.user.email ?? session.user.id}
            </p>
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
                : "Auth listo cuando configures Supabase (LCOS_AUTH_REQUIRED)."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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
            </div>
          </>
        )}
      </section>

      {process.env.NODE_ENV === "development" ? (
        <>
          <section className="rounded-[14px] border border-dashed border-[var(--color-border-strong)] p-3.5">
            <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
              Dev · persona
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              Solo en desarrollo. Cambia de persona para probar vínculos de hogar.
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
              Dev · rol
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              Solo en desarrollo. Simula permisos — independiente de tu hogar.
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
