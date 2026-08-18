"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import { useTenantLocations } from "@/lib/location";
import { listRegisteredTenantSlugs } from "@/lib/tenant/registry";
import { useTenant } from "@/providers/TenantProvider";

/**
 * Tenant admin surface — manage community places (Location SoT).
 * Full RBAC lands with enforced Supabase Auth + memberships.
 */
export function AdminScreen() {
  const router = useRouter();
  const { configuration, role, tenantSlug } = useTenant();
  const { allLocations, seedReady } = useTenantLocations(configuration.tenantId);
  const packs = useMemo(() => listRegisteredTenantSlugs(), []);

  const canAdmin = role === "administrator";

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
          description="Necesitas un rol de administrador en esta comunidad."
          actionLabel="Volver"
          onAction={() => router.push("/")}
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
            Tenant activo
          </p>
          <p className="mt-1 text-[15px] text-[var(--color-text-primary)]">
            {tenantSlug}
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            Packs registrados: {packs.join(", ")}
          </p>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border-subtle)] p-4">
          <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            Locations ({seedReady ? allLocations.length : "…"})
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
