"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  PlatformBusinessIntelligenceContext,
  TenantAnalyticsContext,
} from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

type Insight = {
  tenantId: string;
  kind: string;
  detail: string;
};

export function PlatformAnalyticsScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [overview, setOverview] =
    useState<PlatformBusinessIntelligenceContext | null>(null);
  const [tenants, setTenants] = useState<TenantAnalyticsContext[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [forbidden, setForbidden] = useState(false);

  const refresh = useCallback(async () => {
    const [overviewRes, tenantsRes] = await Promise.all([
      fetch("/api/platform/analytics", { cache: "no-store" }),
      fetch("/api/platform/analytics/tenants", { cache: "no-store" }),
    ]);
    if (
      overviewRes.status === 401 ||
      overviewRes.status === 403 ||
      tenantsRes.status === 401 ||
      tenantsRes.status === 403
    ) {
      setForbidden(true);
      return;
    }
    if (!overviewRes.ok || !tenantsRes.ok) return;
    const overviewData = (await overviewRes.json()) as {
      overview?: PlatformBusinessIntelligenceContext;
      insights?: Insight[];
    };
    const tenantsData = (await tenantsRes.json()) as {
      tenants?: TenantAnalyticsContext[];
    };
    setOverview(overviewData.overview ?? null);
    setInsights(overviewData.insights ?? []);
    setTenants(tenantsData.tenants ?? []);
    setForbidden(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!currentUser.authenticated || forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Platform Analytics"
          onBack={() => router.push("/platform/admin")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso de plataforma"
          description="Solo operadores SaaS pueden ver analytics agregados."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Platform Analytics"
        subtitle="Business intelligence SaaS"
        onBack={() => router.push("/platform/admin")}
        onExit={() => router.push("/")}
      />
      <Link
        href="/platform/admin"
        className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Platform Admin
      </Link>
      {overview ? (
        <section className="mt-6 space-y-4 text-[13px]">
          <div className="rounded-[12px] border border-[var(--color-border-glass)] px-3 py-2">
            <p className="font-semibold">Resumen SaaS</p>
            <p className="mt-1">
              {overview.activeTenantCount} activos / {overview.tenantCount} tenants
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Territories usados: {overview.capacityUsage.totalTerritoriesUsed} ·
              Near limit: {overview.capacityUsage.tenantsNearLimit}
            </p>
          </div>
          <div>
            <p className="font-semibold">Health operativo</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Healthy {overview.operationalHealth.healthy} · Attention{" "}
              {overview.operationalHealth.attentionRequired} · Blocked{" "}
              {overview.operationalHealth.blocked} · Critical{" "}
              {overview.operationalHealth.critical}
            </p>
          </div>
          <div>
            <p className="font-semibold">Tenants</p>
            <ul className="mt-2 space-y-2">
              {tenants.map((row) => (
                <li
                  key={row.tenantId}
                  className="rounded-[12px] border border-[var(--color-border-glass)] px-3 py-2"
                >
                  <p className="font-semibold">{row.tenantId}</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    Plan {row.plan} · {row.operationalHealth} · Features activas:{" "}
                    {row.featureUsage.activeFeatures.length}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    Capacity: {row.capacity.usage.territories} territories ·{" "}
                    {row.capacity.usage.members} members
                  </p>
                </li>
              ))}
            </ul>
          </div>
          {insights.length ? (
            <div>
              <p className="font-semibold">Customer Success signals</p>
              <ul className="mt-1 space-y-1 text-[12px] text-[var(--color-text-secondary)]">
                {insights.slice(0, 8).map((row, index) => (
                  <li key={`${row.tenantId}-${row.kind}-${index}`}>
                    {row.tenantId}: {row.detail}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </MobileScreen>
  );
}
