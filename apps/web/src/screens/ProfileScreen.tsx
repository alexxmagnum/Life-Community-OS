"use client";

import {
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
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

const roles: { id: DemoRole; label: string }[] = [
  { id: "member", label: "Miembro" },
  { id: "group_manager", label: "Responsable de grupo" },
  { id: "moderator", label: "Moderador" },
  { id: "administrator", label: "Administrador" },
];

/**
 * Mi perfil — personal navigation system (separate from Community Explorer).
 * Answers: "Who am I and what is my relationship with the community?"
 * Navigation IA only — no new domain models.
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

  const narrative =
    residencyDemoNarratives[demoMember.narrativeKey].summary;

  const residencyTone =
    demoMember.residencyStatusKind === "verified"
      ? "text-[var(--color-success)]"
      : demoMember.residencyStatusKind === "pending"
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-action-primary)]";

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Mi perfil"
        subtitle="Tu identidad y tu relación con la comunidad."
      />

      <ProfileCard
        name={demoMember.fullName}
        membershipLabel={demoMember.membershipLabel}
        areaLabel={
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
        <ExploreLink
          label="Idioma"
          hint="Español"
          onClick={() => undefined}
        />
        <ExploreLink
          label="Preferencias de comunicación"
          hint="Cómo y cuándo te avisamos"
          onClick={() => undefined}
        />
      </section>

      {/* Mi residencia */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Mi residencia
        </h2>
        <p className="text-[13px] leading-5 text-[var(--color-text-tertiary)]">
          Tu vínculo verificado con el territorio.
        </p>
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Estado de verificación
          </p>
          <p className={`mt-1 text-[15px] font-semibold ${residencyTone}`}>
            {demoMember.residencyStatusLabel}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
            {narrative}
          </p>
          {demoMember.areaLabel ? (
            <p className="mt-3 text-[13px] font-medium text-[var(--color-text-primary)]">
              Área · {demoMember.areaLabel}
            </p>
          ) : null}
        </div>
      </section>

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
        <ExploreLink
          label="Idioma"
          hint="Español"
          onClick={() => undefined}
        />
      </section>

      {hasCapability(CAPABILITIES.manageEnter) ? (
        <ExploreLink
          label="Gestionar comunidad"
          hint="Solo para quien administra"
          onClick={() => undefined}
        />
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-4">
        <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
          Demo · persona / residencia
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
          Valida acceso a recursos y espacios privados. La reclamación pendiente
          no otorga acceso.
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
          Simula el futuro RBAC — no es el sistema real.
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
