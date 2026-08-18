"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipRole } from "@life-community-os/types";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import { useTenantLocations } from "@/lib/location";
import { listRegisteredTenantSlugs } from "@/lib/tenant/registry";
import { useTenant } from "@/providers/TenantProvider";

type MemberRow = {
  membershipId: string;
  personId: string;
  role: MembershipRole;
  status: string;
  email: string | null;
  displayName: string | null;
  updatedAt: string;
};

const ROLES: MembershipRole[] = [
  "member",
  "group_manager",
  "moderator",
  "administrator",
];

const ROLE_LABEL: Record<MembershipRole, string> = {
  member: "Miembro",
  group_manager: "Gestor de grupo",
  moderator: "Moderador",
  administrator: "Administrador",
};

const TENANT_LABEL: Record<string, string> = {
  "life-panoramica": "Life Panorámica",
  "life-valley": "Life Valley",
};

/**
 * Tenant admin surface — places, members, permissions.
 */
export function AdminScreen() {
  const router = useRouter();
  const { configuration, role, tenantSlug, authenticated } = useTenant();
  const { allLocations, seedReady } = useTenantLocations(configuration.tenantId);
  const packs = useMemo(() => listRegisteredTenantSlugs(), []);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [busyPersonId, setBusyPersonId] = useState<string | null>(null);

  const canAdmin = role === "administrator";

  const refreshMembers = useCallback(async () => {
    if (!canAdmin) return;
    setMembersError(null);
    try {
      const res = await fetch("/api/admin/memberships", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) {
        setMembersError(
          res.status === 403
            ? "Inicia sesión como administrador para gestionar miembros."
            : "No se pudieron cargar los miembros.",
        );
        setMembers([]);
        return;
      }
      const data = (await res.json()) as { members?: MemberRow[] };
      setMembers(data.members ?? []);
    } catch {
      setMembersError("Error de red al cargar miembros.");
    }
  }, [canAdmin, tenantSlug]);

  useEffect(() => {
    void refreshMembers();
  }, [refreshMembers]);

  const changeRole = async (personId: string, nextRole: MembershipRole) => {
    setBusyPersonId(personId);
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-slug": tenantSlug,
        },
        body: JSON.stringify({ personId, role: nextRole }),
      });
      if (res.ok) await refreshMembers();
    } finally {
      setBusyPersonId(null);
    }
  };

  if (!canAdmin) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Administración"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Sin permisos de administración"
          description={
            authenticated
              ? "Necesitas un rol de administrador en esta comunidad."
              : "Únete a la comunidad desde Perfil y pide rol administrador."
          }
          actionLabel="Ir a perfil"
          onAction={() => router.push("/me")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Administración"
        subtitle={configuration.branding.name || tenantSlug}
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />

      <section className="mt-4 space-y-4 pb-24">
        <div className="rounded-[16px] border border-[var(--color-border-subtle)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Comunidad activa
          </p>
          <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
            {configuration.branding.name ||
              TENANT_LABEL[tenantSlug] ||
              tenantSlug}
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            Cambia de comunidad para administrar otro espacio.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packs.map((slug) => (
              <button
                key={slug}
                type="button"
                className={
                  slug === tenantSlug
                    ? "min-h-[36px] rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
                    : "min-h-[36px] rounded-full bg-[var(--color-surface-muted)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)]"
                }
                onClick={() => {
                  document.cookie = `lcos-tenant-slug=${encodeURIComponent(slug)}; path=/; max-age=2592000; samesite=lax`;
                  window.location.href = "/admin";
                }}
              >
                {TENANT_LABEL[slug] || slug}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border-subtle)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Miembros y permisos ({members.length})
          </p>
          {membersError ? (
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
              {membersError}
            </p>
          ) : null}
          <ul className="mt-3 space-y-3">
            {members.map((member) => (
              <li
                key={member.membershipId}
                className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
              >
                <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                  {member.displayName || member.email || member.personId}
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {member.email || member.personId}
                </p>
                <label className="mt-2 flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
                  Rol
                  <select
                    className="min-h-[36px] flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-transparent px-2"
                    value={member.role}
                    disabled={busyPersonId === member.personId}
                    onChange={(e) =>
                      void changeRole(
                        member.personId,
                        e.target.value as MembershipRole,
                      )
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border-subtle)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Lugares ({seedReady ? allLocations.length : "…"})
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            Lugares publicados en el mapa de esta comunidad.
          </p>
          <ul className="mt-3 space-y-2">
            {allLocations.slice(0, 40).map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  className="w-full rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2 text-left"
                  onClick={() => router.push(`/locations/${loc.id}`)}
                >
                  <span className="block text-[15px] font-medium text-[var(--color-text-primary)]">
                    {loc.name}
                  </span>
                  <span className="block text-[13px] text-[var(--color-text-tertiary)]">
                    {loc.category} · {loc.visibility}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[var(--color-action-primary)] px-4 text-[15px] font-semibold text-[var(--color-text-on-action,#fff)]"
          onClick={() => router.push("/business/register")}
        >
          Publicar lugar
        </button>
      </section>
    </MobileScreen>
  );
}
