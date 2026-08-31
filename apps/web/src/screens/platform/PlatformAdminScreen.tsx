"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PLATFORM_ADMIN_SURFACES,
  TENANT_PLANS,
  limitsForPlan,
  type PlatformAlert,
  type PlatformAuditRecord,
  type PlatformOperationsContext,
  type PlatformSecurityEvent,
  type ProvisionedTenant,
} from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

type TerritoryRow = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
};

export function PlatformAdminScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [tenants, setTenants] = useState<ProvisionedTenant[]>([]);
  const [territories, setTerritories] = useState<TerritoryRow[]>([]);
  const [context, setContext] = useState<PlatformOperationsContext | null>(null);
  const [audit, setAudit] = useState<PlatformAuditRecord[]>([]);
  const [security, setSecurity] = useState<PlatformSecurityEvent[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [territoryName, setTerritoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [tenantsRes, operationsRes, territoriesRes, auditRes, securityRes] =
      await Promise.all([
        fetch("/api/platform/tenants", { cache: "no-store" }),
        fetch("/api/platform/operations", { cache: "no-store" }),
        fetch("/api/platform/territories", { cache: "no-store" }),
        fetch("/api/platform/audit", { cache: "no-store" }),
        fetch("/api/platform/security", { cache: "no-store" }),
      ]);
    if (tenantsRes.status === 401 || tenantsRes.status === 403) {
      setForbidden(true);
      setTenants([]);
      return;
    }
    if (!tenantsRes.ok) return;
    const tenantsData = (await tenantsRes.json()) as {
      tenants?: ProvisionedTenant[];
    };
    setTenants(tenantsData.tenants ?? []);
    setForbidden(false);
    if (operationsRes.ok) {
      const data = (await operationsRes.json()) as {
        context?: PlatformOperationsContext;
      };
      setContext(data.context ?? null);
    }
    if (territoriesRes.ok) {
      const data = (await territoriesRes.json()) as {
        territories?: TerritoryRow[];
      };
      setTerritories(data.territories ?? []);
    }
    if (auditRes.ok) {
      const data = (await auditRes.json()) as { audit?: PlatformAuditRecord[] };
      setAudit(data.audit ?? []);
    }
    if (securityRes.ok) {
      const data = (await securityRes.json()) as {
        events?: PlatformSecurityEvent[];
      };
      setSecurity(data.events ?? []);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!currentUser.authenticated || forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Platform Admin"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso de plataforma"
          description="Este espacio gestiona el SaaS. No es el admin de una comunidad."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Platform Admin"
        subtitle="Control plane SaaS"
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />
      <p className="mt-3 text-[13px] text-[var(--color-text-tertiary)]">
        PLATFORM → TENANT → TERRITORY. Distinto de /admin/operations.
      </p>
      <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
        {PLATFORM_ADMIN_SURFACES.join(" · ")}
      </p>
      {context ? (
        <section className="mt-4 rounded-[16px] border border-[var(--color-border-glass)] px-4 py-3 text-[13px]">
          <p className="font-semibold">Estado operacional</p>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {context.tenantsCount} tenants · {context.activeTenants} active ·{" "}
            {context.territoriesCount} territories · health{" "}
            {context.systemHealth.status}
          </p>
          {context.alerts.length ? (
            <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
              {context.alerts.map((alert: PlatformAlert, index) => (
                <li key={`${alert.kind}-${alert.tenantId ?? index}`}>
                  {alert.kind}: {alert.detail}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      <section className="mt-6 space-y-2">
        <p className="text-[13px] font-semibold">Nueva comunidad</p>
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Territory inicial"
          value={territoryName}
          onChange={(event) => setTerritoryName(event.target.value)}
        />
        {error ? (
          <p className="text-[13px] text-[var(--color-feedback-danger)]">{error}</p>
        ) : null}
        <button
          type="button"
          className="rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[13px] font-semibold text-white"
          onClick={() => {
            void fetch("/api/platform/tenants", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name,
                slug,
                locale: "en",
                timezone: "UTC",
                territories: [{ name: territoryName || name }],
              }),
            }).then((res) => {
              if (!res.ok) {
                setError("No se pudo crear.");
                return;
              }
              setName("");
              setSlug("");
              setTerritoryName("");
              setError(null);
              void refresh();
            });
          }}
        >
          Crear Tenant
        </button>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Tenants</p>
        <ul className="mt-2 space-y-2 text-[14px]">
          {tenants.map((tenant) => (
            <li
              key={tenant.id}
              className="rounded-[16px] border border-[var(--color-border-glass)] px-4 py-3"
            >
              <span className="font-semibold">{tenant.name}</span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-text-tertiary)]">
                {tenant.slug} · {tenant.plan} · {tenant.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Territories</p>
        <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
          {territories.map((row) => (
            <li key={row.id}>
              {row.name} · {row.slug}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Features</p>
        <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
          {context
            ? Object.entries(context.featuresUsage).map(([feature, count]) => (
                <li key={feature}>
                  {feature}: {count}
                </li>
              ))
            : null}
        </ul>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Plans</p>
        <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
          {TENANT_PLANS.map((plan) => {
            const limits = limitsForPlan(plan);
            return (
              <li key={plan}>
                {plan} · territories {limits.territories}
                {limits.members == null ? "" : ` · members ${limits.members}`}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Security Events</p>
        <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {security.length === 0 ? <li>Sin eventos</li> : null}
          {security.map((event) => (
            <li key={`${event.kind}-${event.timestamp}`}>
              {event.kind} · {event.action}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 mb-8">
        <p className="text-[13px] font-semibold">Audit Logs</p>
        <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {audit.length === 0 ? <li>Sin registros</li> : null}
          {audit.map((row) => (
            <li key={`${row.action}-${row.timestamp}-${row.tenantId}`}>
              {row.action} · {row.tenantId}
            </li>
          ))}
        </ul>
      </section>
    </MobileScreen>
  );
}
