"use client";

import {
  currentMember,
  profileShortcuts,
} from "@life-community-os/tenant-life-panoramica";
import {
  ExploreLink,
  MobileScreen,
  ProfileCard,
  ScreenHeader,
} from "@life-community-os/ui";
import { useRouter } from "next/navigation";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import type { DemoRole } from "@life-community-os/tenant-life-panoramica";

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
  const { theme, hasCapability, isFeatureEnabled, role, setRole } = useTenant();

  return (
    <MobileScreen>
      <ScreenHeader
        eyebrow={theme.logoText}
        title="Yo"
        subtitle="Tu vida dentro de la comunidad."
      />

      <ProfileCard
        name={currentMember.fullName}
        membershipLabel={currentMember.membershipLabel}
        areaLabel={theme.logoText}
        interests={currentMember.interests}
        avatarUrl={currentMember.avatarUrl}
        onEdit={() => undefined}
      />

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
