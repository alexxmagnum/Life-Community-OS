"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductionReadinessContext } from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

export function PlatformOperationsScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [readiness, setReadiness] = useState<ProductionReadinessContext | null>(
    null,
  );
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/platform/production-readiness", {
      credentials: "include",
    });
    if (res.status === 403) {
      setForbidden(true);
      setReadiness(null);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { readiness?: ProductionReadinessContext };
    setReadiness(data.readiness ?? null);
    setForbidden(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Platform Operations"
          onBack={() => router.push("/platform/admin")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso restringido"
          description="Solo el Platform Operator puede ver operaciones de producción."
          actionLabel="Volver"
          onAction={() => router.push("/platform/admin")}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Platform Operations"
        onBack={() => router.push("/platform/admin")}
        onExit={() => router.push("/")}
      />
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/platform/admin" className="underline">
            Control plane
          </Link>
          <Link href="/platform/analytics" className="underline">
            Analytics
          </Link>
          <Link href="/platform/privacy" className="underline">
            Privacy
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Cargando operaciones…</p>
        ) : readiness ? (
          <>
            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Environment</h2>
              <p className="text-sm text-neutral-600">
                {readiness.environment.environment} ·{" "}
                {readiness.environment.deploymentStatus} · v
                {readiness.environment.version}
              </p>
              <p className="text-sm text-neutral-600">
                Config health: {readiness.environment.configurationHealth}
              </p>
            </section>

            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Database</h2>
              <p className="text-sm text-neutral-600">
                Schema {readiness.database.schemaVersion} ·{" "}
                {readiness.database.migrationStatus} · pending{" "}
                {readiness.database.pendingMigrations}
              </p>
            </section>

            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Health</h2>
              <p className="text-sm text-neutral-600">
                Overall: {readiness.health.overall}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {readiness.health.signals.map((signal) => (
                  <li key={signal.component}>
                    {signal.component}: {signal.status}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Supabase readiness</h2>
              <p className="text-sm text-neutral-600">
                Auth {readiness.supabase.authConfigured ? "ok" : "pending"} · RLS{" "}
                {readiness.supabase.rlsValidated ? "ok" : "pending"} · API{" "}
                {readiness.supabase.apiProtectionStatus}
              </p>
            </section>

            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Incidents</h2>
              {readiness.incidents.length === 0 ? (
                <p className="text-sm text-neutral-500">Sin incidentes abiertos.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {readiness.incidents.map((incident) => (
                    <li key={incident.id}>
                      {incident.title} — {incident.status}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Launch checklist</h2>
              <ul className="space-y-2 text-sm">
                {readiness.launchChecklists.map((row) => (
                  <li key={row.tenantId}>
                    {row.tenantId}: {row.status}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-neutral-200 p-4">
              <h2 className="font-semibold">Backup verification</h2>
              {readiness.backupVerifications.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Sin verificaciones registradas.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {readiness.backupVerifications.map((row) => (
                    <li key={row.backupId}>
                      {row.backupId} · {row.verificationStatus}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </MobileScreen>
  );
}
