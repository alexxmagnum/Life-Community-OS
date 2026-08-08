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
 * Yo answers: "What is my life inside the community?"
 * Agenda/reservations are personal surfaces — not primary nav tabs.
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
        title="Yo"
        subtitle="Tu vida dentro de la comunidad."
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

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Estado de residencia
        </p>
        <p className={`mt-1 text-[15px] font-semibold ${residencyTone}`}>
          {demoMember.residencyStatusLabel}
        </p>
        <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
          {narrative}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Lo mío
        </h2>
        {isFeatureEnabled("experiences") || isFeatureEnabled("calendar") ? (
          <ExploreLink
            label="Mis actividades"
            hint={`${profileShortcuts.going} próximas`}
            onClick={() => router.push("/calendar")}
          />
        ) : null}
        {isFeatureEnabled("resources") ? (
          <ExploreLink
            label="Mis reservas"
            hint={`${profileShortcuts.reservations} activas`}
            onClick={() => router.push("/reservations")}
          />
        ) : null}
        {isFeatureEnabled("groups") ? (
          <ExploreLink
            label="Mis grupos"
            hint="Dónde participas"
            onClick={() => router.push("/community?tab=grupos")}
          />
        ) : null}
        {isFeatureEnabled("communityChannels") ? (
          <ExploreLink
            label="Canales"
            hint="Oficiales, comunidad y privados"
            onClick={() => router.push("/community?tab=canales")}
          />
        ) : null}
        {isFeatureEnabled("feed") ? (
          <ExploreLink
            label="Mis publicaciones"
            hint={`${profileShortcuts.saves} guardadas`}
            onClick={() => router.push("/community?tab=conversaciones")}
          />
        ) : null}
        {isFeatureEnabled("marketplace") ? (
          <ExploreLink
            label="Mis anuncios"
            hint="Lo que ofreces o buscas"
            onClick={() => router.push("/marketplace")}
          />
        ) : null}
        <ExploreLink
          label="Avisar de un problema"
          hint="Foto y descripción breve"
          onClick={() => router.push("/report")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold">
          Cuenta
        </h2>
        <ExploreLink
          label="Notificaciones"
          hint="3 sin leer"
          onClick={() => undefined}
        />
        {["Preferencias de aviso", "Privacidad", "Idioma"].map((row) => (
          <ExploreLink key={row} label={row} onClick={() => undefined} />
        ))}
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
          Valida acceso a recursos y canales privados. La reclamación pendiente
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
