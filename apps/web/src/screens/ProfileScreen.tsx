"use client";

import { useMemo } from "react";
import {
  getMyHomeContext,
  getTerritoryAccessContext,
  profileShortcuts,
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

const roles: { id: DemoRole; label: string }[] = [
  { id: "member", label: "Miembro" },
  { id: "group_manager", label: "Responsable de grupo" },
  { id: "moderator", label: "Moderador" },
  { id: "administrator", label: "Administrador" },
];

/**
 * Mi perfil — personal navigation system (separate from Community Explorer).
 * Answers: "Who am I and what is my place in the territory?" (D.0.7.2.1 My Home).
 * Property ownership is context — never community administration.
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

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Mi perfil"
        subtitle="Tu identidad y tu lugar en el territorio."
      />

      <ProfileCard
        name={demoMember.fullName}
        membershipLabel={demoMember.membershipLabel}
        areaLabel={
          primary?.communityAreaLabel ||
          demoMember.areaLabel ||
          theme.identity?.defaultAreaName ||
          theme.logoText
        }
        interests={demoMember.interests}
        avatarUrl={demoMember.avatarUrl}
        onEdit={() => undefined}
      />

      {/* Mi identidad */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Mi identidad
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Cómo apareces en la comunidad.
        </p>
        <ExploreLink
          label="Nombre y foto"
          hint={demoMember.fullName}
          onClick={() => undefined}
        />
        <ExploreLink label="Idioma" hint="Español" onClick={() => undefined} />
        <ExploreLink
          label="Preferencias de comunicación"
          hint="Cómo y cuándo te avisamos"
          onClick={() => undefined}
        />
      </section>

      {/* Mi hogar — Property + PPR context (D.0.7.2.1) */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Mi hogar
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Tu vínculo con una propiedad del territorio — no es un catálogo
          inmobiliario.
        </p>
        {primary ? (
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
              {primary.relationshipLabel}
            </p>
            <p className="mt-1 text-[17px] font-semibold text-[var(--color-text-primary)]">
              {primary.headline}
            </p>
            {primary.property.name || primary.address.line1 ? (
              <p className="mt-1 text-[14px] leading-5 text-[var(--color-text-secondary)]">
                {primary.property.name ?? primary.address.line1}
              </p>
            ) : null}
            <p className={`mt-3 text-[15px] font-semibold ${residencyTone}`}>
              {primary.statusLabel}
            </p>
            <div className="mt-3 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
              {primary.communityAreaLabel ? (
                <p>
                  Área comunitaria ·{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {primary.communityAreaLabel}
                  </span>
                </p>
              ) : null}
              <p>
                Territorio ·{" "}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {primary.territoryLabel}
                </span>
              </p>
              {primary.grantsResidencyAccess ? (
                <p className="text-[var(--color-success)]">
                  Acceso de residencia activo en tu área.
                </p>
              ) : primary.statusKind === "pending" ? (
                <p className="text-[var(--color-warning)]">
                  La reclamación no concede acceso restringido hasta
                  verificarse.
                </p>
              ) : null}
            </div>
            <p className="mt-3 text-[12px] leading-5 text-[var(--color-text-tertiary)]">
              Ser propietario o residente no otorga administración de la
              comunidad.
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
            <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              Sin hogar vinculado
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
              {home.emptyMessage}
            </p>
            <p className={`mt-3 text-[14px] font-semibold ${residencyTone}`}>
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
                className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-3 shadow-[var(--shadow-elev-1)]"
              >
                <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
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

      {/* Mis intereses */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Mis intereses
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Para recibir contenido más relevante.
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
          <ExploreLink
            label="Elegir intereses"
            hint="Golf, pádel, gastronomía…"
            onClick={() => undefined}
          />
        )}
        <ExploreLink
          label="Editar intereses"
          hint="Ajusta lo que te importa"
          onClick={() => undefined}
        />
      </section>

      {/* Mi actividad */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Mi actividad
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Tu participación en la comunidad.
        </p>
        {isFeatureEnabled("experiences") ? (
          <ExploreLink
            label="Experiencias creadas y unidas"
            hint={`${profileShortcuts.going} próximas`}
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
            label="Participación comunitaria"
            hint="Propuestas, encuestas y aportaciones"
            onClick={() => router.push("/community")}
          />
        ) : null}
      </section>

      {/* Mis reservas */}
      {isFeatureEnabled("resources") ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
            Mis reservas
          </h2>
          <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
            Acceso rápido a tus reservas.
          </p>
          <ExploreLink
            label="Próximas reservas"
            hint={`${profileShortcuts.reservations} activas`}
            onClick={() => router.push("/reservations")}
          />
          <ExploreLink
            label="Historial"
            hint="Reservas anteriores"
            onClick={() => router.push("/reservations")}
          />
        </section>
      ) : null}

      {/* Mis guardados */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Mis guardados
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Para volver a lo que te interesa.
        </p>
        {isFeatureEnabled("experiences") ? (
          <ExploreLink
            label="Experiencias guardadas"
            hint={`${profileShortcuts.saves} guardadas`}
            onClick={() => router.push("/experiences")}
          />
        ) : null}
        {isFeatureEnabled("localLife") || isFeatureEnabled("localEntities") ? (
          <ExploreLink
            label="Lugares guardados"
            hint="Sitios cerca de ti"
            onClick={() => router.push("/discover")}
          />
        ) : null}
      </section>

      {/* Configuración */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Configuración
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Gestiona tu cuenta.
        </p>
        <ExploreLink
          label="Privacidad"
          hint="Quién ve tu información"
          onClick={() => undefined}
        />
        <ExploreLink
          label="Notificaciones"
          hint="3 sin leer"
          onClick={() => undefined}
        />
        <ExploreLink label="Idioma" hint="Español" onClick={() => undefined} />
      </section>

      {hasCapability(CAPABILITIES.manageEnter) ? (
        <ExploreLink
          label="Gestionar comunidad"
          hint="Solo para quien administra — independiente de la propiedad"
          onClick={() => undefined}
        />
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-4">
        <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
          Demo · persona / Mi hogar
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
          Cambia de persona para ver distintos vínculos Property ↔ Person. La
          reclamación pendiente no otorga acceso.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {demoMembers.map((m) => (
            <button
              key={m.personId}
              type="button"
              onClick={() => setDemoPersonId(m.personId)}
              className={
                demoPersonId === m.personId
                  ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
                  : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
              }
            >
              {m.displayName}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-4">
        <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
          Vista previa de rol (fundación)
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
          Simula el futuro RBAC — independiente de propiedad / residencia.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={
                role === r.id
                  ? "min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
                  : "min-h-[40px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>
    </MobileScreen>
  );
}
