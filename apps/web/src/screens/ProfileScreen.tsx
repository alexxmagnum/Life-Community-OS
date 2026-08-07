"use client";

import {
  currentMember,
  profileShortcuts,
} from "@life-community-os/tenant-life-panoramica";
import { ProfileCard } from "@life-community-os/ui";
import { useRouter } from "next/navigation";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";
import type { DemoRole } from "@life-community-os/tenant-life-panoramica";

const roles: { id: DemoRole; label: string }[] = [
  { id: "member", label: "Miembro" },
  { id: "group_manager", label: "Responsable de grupo" },
  { id: "moderator", label: "Moderador" },
  { id: "administrator", label: "Administrador" },
];

export function ProfileScreen() {
  const router = useRouter();
  const { hasCapability, isFeatureEnabled, role, setRole } = useTenant();

  const tiles = [
    {
      label: "Planes",
      value: `${profileShortcuts.going} próximos`,
      href: "/calendar",
      show: isFeatureEnabled("experiences"),
    },
    {
      label: "Lugares",
      value: `${profileShortcuts.reservations} reserva`,
      href: "/reservations",
      show: isFeatureEnabled("resources"),
    },
    {
      label: "Avisos",
      value: `${profileShortcuts.requests} abierto`,
      href: "/report",
      show: isFeatureEnabled("incidents"),
    },
    {
      label: "Guardados",
      value: `${profileShortcuts.saves} guardados`,
      href: "/community",
      show: true,
    },
    {
      label: "Mercado",
      value: "Mis anuncios",
      href: "/marketplace",
      show: isFeatureEnabled("marketplace"),
    },
  ].filter((t) => t.show);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold">
        Yo
      </h1>

      <ProfileCard
        name={currentMember.fullName}
        membershipLabel={currentMember.membershipLabel}
        areaLabel={currentMember.areaLabel}
        interests={currentMember.interests}
        avatarUrl={currentMember.avatarUrl}
        onEdit={() => undefined}
      />

      <button
        type="button"
        onClick={() => undefined}
        className="flex min-h-[56px] w-full items-center justify-between rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 shadow-[var(--shadow-elev-1)]"
      >
        <span className="text-[16px] font-semibold">Notificaciones</span>
        <span className="rounded-full bg-[var(--color-action-accent)] px-2 py-0.5 text-[12px] font-semibold text-white">
          3
        </span>
      </button>

      <section>
        <h2 className="mb-3 text-[18px] font-semibold">Mi vida en la comunidad</h2>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => (
            <button
              key={tile.label}
              type="button"
              onClick={() => router.push(tile.href)}
              className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 text-left shadow-[var(--shadow-elev-1)]"
            >
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                {tile.label}
              </p>
              <p className="mt-2 text-[17px] font-semibold">{tile.value}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elev-1)]">
        {["Preferencias de notificación", "Privacidad", "Idioma"].map((row) => (
          <button
            key={row}
            type="button"
            className="flex min-h-[52px] w-full items-center justify-between border-b border-[var(--color-border-subtle)] px-4 text-left text-[16px] last:border-b-0"
          >
            {row}
            <span className="text-[var(--color-text-tertiary)]">›</span>
          </button>
        ))}
      </section>

      {hasCapability(CAPABILITIES.manageEnter) ? (
        <button
          type="button"
          className="flex min-h-[56px] w-full items-center justify-between rounded-[var(--radius-lg)] bg-[var(--color-action-primary-subtle)] px-4 text-[16px] font-semibold text-[var(--color-action-primary)]"
        >
          Gestionar comunidad
          <span>›</span>
        </button>
      ) : null}

      <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-4">
        <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
          Vista previa de rol (fundación)
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
          Simula el futuro RBAC — no es el sistema de permisos real.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={
                role === r.id
                  ? "rounded-full bg-[var(--color-action-primary)] px-3 py-2 text-[13px] font-semibold text-white"
                  : "rounded-full bg-[var(--color-surface-muted)] px-3 py-2 text-[13px] font-semibold text-[var(--color-text-secondary)]"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
