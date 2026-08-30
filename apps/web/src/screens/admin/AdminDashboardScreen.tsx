"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OperationsDashboardMetrics } from "@/lib/admin/operations-metrics";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

const EMPTY: OperationsDashboardMetrics = {
  tenantId: "",
  activeMembers: 0,
  newMembers: 0,
  publishedBusinesses: 0,
  upcomingReservations: 0,
  pendingPublications: 0,
  openHelpRequests: 0,
  incidents: 0,
};

export function AdminDashboardScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [metrics, setMetrics] = useState<OperationsDashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/operations", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (res.status === 403) {
        setError("forbidden");
        return;
      }
      if (!res.ok) {
        setError("load_failed");
        return;
      }
      const data = (await res.json()) as { metrics: OperationsDashboardMetrics };
      setMetrics(data.metrics);
    })();
  }, [tenantSlug]);

  const shown = metrics ?? EMPTY;

  return (
    <AdminOperationsShell title="Operations Center" section="dashboard">
      {error === "forbidden" ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          No puedes ver el dashboard de otro tenant.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Usuarios activos", shown.activeMembers, "/admin/members"],
            ["Nuevos miembros", shown.newMembers, "/admin/members"],
            ["Negocios publicados", shown.publishedBusinesses, "/admin/businesses"],
            ["Reservas próximas", shown.upcomingReservations, "/admin/reservations"],
            ["Publicaciones pendientes", shown.pendingPublications, "/admin/moderation"],
            ["Solicitudes de ayuda", shown.openHelpRequests, "/admin/marketplace"],
          ].map(([label, value, href]) => (
            <button
              key={String(label)}
              type="button"
              className="rounded-[16px] border border-[var(--color-border-subtle)] p-4 text-left"
              onClick={() => router.push(String(href))}
            >
              <p className="text-[13px] text-[var(--color-text-tertiary)]">{label}</p>
              <p className="mt-1 text-[22px] font-semibold text-[var(--color-text-primary)]">
                {metrics ? value : "—"}
              </p>
            </button>
          ))}
        </div>
      )}
      <AdminCard title="Incidencias">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Sin incidencias registradas. Este dominio aún no existe en la plataforma.
        </p>
      </AdminCard>
    </AdminOperationsShell>
  );
}
