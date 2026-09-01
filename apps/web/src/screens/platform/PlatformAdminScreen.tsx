"use client";

import Link from "next/link";
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
  type TenantFeatureObservability,
  type TenantHealthContext,
  type TenantProvisioningStatus,
  type TenantSaaSContract,
  type TenantSubscription,
  type TenantLifecycleContext,
  type TenantBackupContext,
  type TenantRestoreContext,
  type TenantDataExport,
  type DisasterRecoveryReadiness,
  type SecurityCenterProjection,
} from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

type TerritoryRow = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
};

function featureLabel(on: boolean): string {
  return on ? "ON" : "OFF";
}

export function PlatformAdminScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [tenants, setTenants] = useState<ProvisionedTenant[]>([]);
  const [territories, setTerritories] = useState<TerritoryRow[]>([]);
  const [context, setContext] = useState<PlatformOperationsContext | null>(null);
  const [health, setHealth] = useState<TenantHealthContext[]>([]);
  const [features, setFeatures] = useState<TenantFeatureObservability[]>([]);
  const [provisioning, setProvisioning] = useState<
    Array<{ tenantId: string; status: TenantProvisioningStatus }>
  >([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [lifecycle, setLifecycle] = useState<TenantLifecycleContext[]>([]);
  const [contracts, setContracts] = useState<TenantSaaSContract[]>([]);
  const [backups, setBackups] = useState<TenantBackupContext[]>([]);
  const [restores, setRestores] = useState<TenantRestoreContext[]>([]);
  const [exports, setExports] = useState<TenantDataExport[]>([]);
  const [recovery, setRecovery] = useState<DisasterRecoveryReadiness | null>(
    null,
  );
  const [audit, setAudit] = useState<PlatformAuditRecord[]>([]);
  const [security, setSecurity] = useState<PlatformSecurityEvent[]>([]);
  const [securityCenter, setSecurityCenter] =
    useState<SecurityCenterProjection | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [territoryName, setTerritoryName] = useState("");
  const [extraTerritory, setExtraTerritory] = useState("");
  const [extraTerritoryTenant, setExtraTerritoryTenant] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [
      tenantsRes,
      operationsRes,
      territoriesRes,
      auditRes,
      securityRes,
      dataRes,
      eventsRes,
    ] =
      await Promise.all([
        fetch("/api/platform/tenants", { cache: "no-store" }),
        fetch("/api/platform/operations", { cache: "no-store" }),
        fetch("/api/platform/territories", { cache: "no-store" }),
        fetch("/api/platform/audit", { cache: "no-store" }),
        fetch("/api/platform/security", { cache: "no-store" }),
        fetch("/api/platform/data-export", { cache: "no-store" }),
        fetch("/api/platform/security/events", { cache: "no-store" }),
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
        health?: TenantHealthContext[];
        features?: TenantFeatureObservability[];
        provisioning?: Array<{
          tenantId: string;
          status: TenantProvisioningStatus;
        }>;
        subscriptions?: TenantSubscription[];
        lifecycle?: TenantLifecycleContext[];
        contracts?: TenantSaaSContract[];
        backups?: TenantBackupContext[];
        recovery?: DisasterRecoveryReadiness;
      };
      setContext(data.context ?? null);
      setHealth(data.health ?? []);
      setFeatures(data.features ?? []);
      setProvisioning(data.provisioning ?? []);
      setSubscriptions(data.subscriptions ?? []);
      setLifecycle((data.lifecycle ?? []).filter((row): row is TenantLifecycleContext => Boolean(row)));
      setContracts(data.contracts ?? []);
      if (data.backups) setBackups(data.backups);
      if (data.recovery) setRecovery(data.recovery);
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
    if (eventsRes.ok) {
      const data = (await eventsRes.json()) as SecurityCenterProjection & {
        events?: PlatformSecurityEvent[];
      };
      setSecurityCenter({
        boundaryEvents: data.boundaryEvents ?? [],
        permissionDenials: data.permissionDenials ?? [],
        auditSecurity: data.auditSecurity ?? [],
        configurationRisks: data.configurationRisks ?? [],
      });
      if (data.events?.length) setSecurity(data.events);
    }
    if (dataRes.ok) {
      const data = (await dataRes.json()) as {
        exports?: TenantDataExport[];
        backups?: TenantBackupContext[];
        restores?: TenantRestoreContext[];
        recovery?: DisasterRecoveryReadiness;
      };
      setExports(data.exports ?? []);
      setBackups(data.backups ?? []);
      setRestores(data.restores ?? []);
      if (data.recovery) setRecovery(data.recovery);
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
      <Link
        href="/platform/privacy"
        className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-action-primary)]"
      >
        Privacy Governance →
      </Link>
      <Link
        href="/platform/customers"
        className="mt-1 inline-block text-[13px] font-semibold text-[var(--color-action-primary)]"
      >
        Customer Operations →
      </Link>
      <Link
        href="/platform/customer-success"
        className="mt-1 inline-block text-[13px] font-semibold text-[var(--color-action-primary)]"
      >
        Customer Success →
      </Link>
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
          {tenants.map((tenant) => {
            const rowHealth = health.find((row) => row.tenantId === tenant.id);
            const rowFeatures = features.find((row) => row.tenantId === tenant.id);
            const rowStage = provisioning.find((row) => row.tenantId === tenant.id);
            const rowLife = lifecycle.find((row) => row.tenantId === tenant.id);
            const rowContract = contracts.find((row) => row.tenantId === tenant.id);
            const rowSub = subscriptions.find((row) => row.tenantId === tenant.id);
            const runLifecycle = (action: string) => {
              void fetch("/api/platform/lifecycle", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  communitySlug: tenant.slug,
                  action,
                  reason: action,
                  explicitConfirmation: action === "suspend",
                }),
              }).then((res) => {
                if (!res.ok) {
                  setError("Operación de ciclo de vida no permitida.");
                  return;
                }
                setError(null);
                void refresh();
              });
            };
            const runDataOp = (action: string) => {
              void fetch("/api/platform/data-export", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  communitySlug: tenant.slug,
                  action,
                  type: "manual",
                  explicitConfirmation: action === "restore",
                  reason: action,
                }),
              }).then((res) => {
                if (!res.ok) {
                  setError("Operación de datos no permitida.");
                  return;
                }
                setError(null);
                void refresh();
              });
            };
            return (
              <li
                key={tenant.id}
                className="rounded-[16px] border border-[var(--color-border-glass)] px-4 py-3"
              >
                <span className="font-semibold">{tenant.name}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--color-text-tertiary)]">
                  {tenant.slug} · {tenant.plan} · {tenant.status}
                  {rowLife ? ` · lifecycle ${rowLife.status}` : ""}
                  {rowHealth ? ` · ${rowHealth.configurationStatus}` : ""}
                  {rowStage ? ` · ${rowStage.status}` : ""}
                  {rowSub ? ` · sub ${rowSub.subscriptionStatus}` : ""}
                </span>
                {rowContract ? (
                  <span className="mt-1 block text-[12px] text-[var(--color-text-secondary)]">
                    contrato {rowContract.plan} · territories{" "}
                    {rowContract.limits.territories ?? "unlimited"} · members{" "}
                    {rowContract.limits.members ?? "unlimited"}
                  </span>
                ) : null}
                {rowFeatures ? (
                  <span className="mt-1 block text-[12px] text-[var(--color-text-secondary)]">
                    Marketplace {featureLabel(rowFeatures.marketplace)} · Life
                    Map {featureLabel(rowFeatures.lifeMap)} · Reservations{" "}
                    {featureLabel(rowFeatures.reservations)}
                  </span>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runLifecycle("activate")}
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runLifecycle("suspend")}
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runLifecycle("restore")}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runLifecycle("archive")}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runDataOp("export")}
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runDataOp("backup")}
                  >
                    Backup
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
                    onClick={() => runDataOp("restore")}
                  >
                    Restore data
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-6 space-y-2">
        <p className="text-[13px] font-semibold">Territories</p>
        <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
          {territories.map((row) => (
            <li key={row.id}>
              {row.name} · {row.slug}
            </li>
          ))}
        </ul>
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="slug del tenant"
          value={extraTerritoryTenant}
          onChange={(event) => setExtraTerritoryTenant(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Nuevo territory"
          value={extraTerritory}
          onChange={(event) => setExtraTerritory(event.target.value)}
        />
        <button
          type="button"
          className="rounded-full bg-[var(--color-surface-muted)] px-4 py-2 text-[13px] font-semibold"
          onClick={() => {
            void fetch("/api/platform/territories", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                communitySlug: extraTerritoryTenant,
                name: extraTerritory,
              }),
            }).then((res) => {
              if (!res.ok) {
                setError("No se pudo crear el territory.");
                return;
              }
              setExtraTerritory("");
              setError(null);
              void refresh();
            });
          }}
        >
          Crear Territory
        </button>
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
            const subscribed = subscriptions.filter((row) => row.plan === plan)
              .length;
            return (
              <li key={plan}>
                {plan} · territories{" "}
                {limits.territories ?? "unlimited"}
                {limits.members == null ? "" : ` · members ${limits.members}`}
                {subscribed ? ` · ${subscribed} tenants` : ""}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Data Operations</p>
        {recovery ? (
          <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
            Recovery RPO {recovery.objectives.rpoMinutes}m · RTO{" "}
            {recovery.objectives.rtoMinutes}m · provider {recovery.cloudProvider}
          </p>
        ) : null}
        <ul className="mt-2 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {backups.length === 0 ? <li>Sin backups</li> : null}
          {backups.map((row) => (
            <li key={row.backupId}>
              backup {row.status} · {row.type} · {row.tenantId}
            </li>
          ))}
          {exports.map((row) => (
            <li key={`${row.tenantId}-${row.generatedAt}`}>
              export {row.tenant.slug} · territories {row.territories.length}
            </li>
          ))}
          {restores.map((row) => (
            <li key={row.restoreId}>
              restore {row.status} · {row.tenantId}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Security Center</p>
        <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
          Control operativo SaaS. No es un SIEM ni un ranking.
        </p>
        <p className="mt-3 text-[12px] font-semibold">Boundary Events</p>
        <ul className="mt-1 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {(securityCenter?.boundaryEvents.length
            ? securityCenter.boundaryEvents
            : security.filter(
                (event) =>
                  event.kind === "cross_tenant" ||
                  event.kind === "territory_mismatch",
              )
          ).length === 0 ? (
            <li>Sin violaciones de frontera</li>
          ) : null}
          {(securityCenter?.boundaryEvents.length
            ? securityCenter.boundaryEvents
            : security.filter(
                (event) =>
                  event.kind === "cross_tenant" ||
                  event.kind === "territory_mismatch",
              )
          ).map((event) => (
            <li key={`${event.kind}-${event.timestamp}-${event.action}`}>
              {event.kind} · {event.action}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] font-semibold">Permission Denials</p>
        <ul className="mt-1 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {(securityCenter?.permissionDenials.length
            ? securityCenter.permissionDenials
            : security.filter((event) => event.kind === "invalid_permission")
          ).length === 0 ? (
            <li>Sin denegaciones</li>
          ) : null}
          {(securityCenter?.permissionDenials.length
            ? securityCenter.permissionDenials
            : security.filter((event) => event.kind === "invalid_permission")
          ).map((event) => (
            <li key={`${event.kind}-${event.timestamp}-deny`}>
              {event.kind} · {event.action}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] font-semibold">Audit Security</p>
        <ul className="mt-1 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {(securityCenter?.auditSecurity.length
            ? securityCenter.auditSecurity
            : audit.filter((row) => row.action.startsWith("security."))
          ).length === 0 ? (
            <li>Sin auditoría de seguridad</li>
          ) : null}
          {(securityCenter?.auditSecurity.length
            ? securityCenter.auditSecurity
            : audit.filter((row) => row.action.startsWith("security."))
          ).map((row) => (
            <li key={`${row.action}-${row.timestamp}-${row.tenantId}`}>
              {row.action} · {row.tenantId}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] font-semibold">Configuration Risks</p>
        <ul className="mt-1 space-y-1 text-[12px] text-[var(--color-text-tertiary)]">
          {(securityCenter?.configurationRisks.length ?? 0) === 0 ? (
            <li>Sin riesgos de configuración</li>
          ) : null}
          {securityCenter?.configurationRisks.map((risk) => (
            <li key={`${risk.kind}-${risk.detail}`}>
              {risk.kind}: {risk.detail}
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
