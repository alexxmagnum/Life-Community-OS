"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OperationsDashboardMetrics } from "@/lib/admin/operations-metrics";
import type { CommunityActivationMetrics } from "@/lib/admin/community-activation-metrics";
import { EMPTY_COMMUNITY_ACTIVATION_METRICS } from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { CommunityLaunchChecklist } from "@/components/admin/CommunityLaunchChecklist";
import { useTenant } from "@/providers/TenantProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

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
  const { context: activeTerritory } = useTerritory();
  const router = useRouter();
  const [metrics, setMetrics] = useState<OperationsDashboardMetrics | null>(null);
  const [activation, setActivation] =
    useState<CommunityActivationMetrics | null>(null);
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
      const data = (await res.json()) as {
        metrics: OperationsDashboardMetrics;
        activation?: CommunityActivationMetrics;
      };
      setMetrics(data.metrics);
      setActivation(data.activation ?? null);
    })();
  }, [tenantSlug]);

  const shown = metrics ?? EMPTY;
  const activity =
    activation ?? EMPTY_COMMUNITY_ACTIVATION_METRICS(tenantSlug);

  return (
    <AdminOperationsShell title="Operations Center" section="dashboard">
      {error === "forbidden" ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          No puedes ver el dashboard de otro tenant.
        </p>
      ) : (
        <>
          <AdminCard title="Actividad comunitaria">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Experiencias creadas", activity.experiencesCreated],
                ["Participantes", activity.experiencesParticipants],
                ["Avisos", activity.announcementsPublished],
                ["Negocios publicados", activity.businessesPublished],
                ["Servicios disponibles", activity.servicesAvailable],
                ["Reservas completadas", activity.reservationsCompleted],
                ["Ayudas creadas", activity.helpRequestsCreated],
                ["Ayudas completadas", activity.helpRequestsCompleted],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-[14px] border border-[var(--color-border-subtle)] p-3"
                >
                  <p className="text-[12px] text-[var(--color-text-tertiary)]">
                    {label}
                  </p>
                  <p className="mt-1 text-[20px] font-semibold text-[var(--color-text-primary)]">
                    {activation ? value : "—"}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-[var(--color-text-tertiary)]">
              Territorio: {activeTerritory.territoryName ?? "—"} · Métricas de
              vida real, no engagement social.
            </p>
          </AdminCard>

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

          <CommunityLaunchChecklist />
        </>
      )}
      <AdminCard title="Incidencias">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Sin incidencias registradas. Este dominio aún no existe en la plataforma.
        </p>
      </AdminCard>
    </AdminOperationsShell>
  );
}
