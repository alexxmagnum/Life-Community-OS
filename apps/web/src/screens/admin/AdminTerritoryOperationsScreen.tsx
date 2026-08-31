"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CommunityOperationsContext,
  TerritoryAnnouncement,
  TerritoryDailyPulse,
} from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import {
  createTerritoryAnnouncementRequest,
  fetchCommunityOperations,
} from "@/lib/community/community-operations-client";
import { fetchGovernanceReports } from "@/lib/governance/governance-client";
import { useTenant } from "@/providers/TenantProvider";
import { useTerritory } from "@/providers/TerritoryProvider";

export function AdminTerritoryOperationsScreen() {
  const { configuration } = useTenant();
  const { context: territory } = useTerritory();
  const [today, setToday] = useState<CommunityOperationsContext["today"] | null>(
    null,
  );
  const [pulse, setPulse] = useState<TerritoryDailyPulse | null>(null);
  const [incidents, setIncidents] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await fetchCommunityOperations({
      tenantId: configuration.tenantId,
      territoryId: territory.territoryId,
    });
    setToday(data.context?.today ?? null);
    setPulse(data.pulse);
    const reports = await fetchGovernanceReports({
      tenantId: configuration.tenantId,
      territoryId: territory.territoryId,
    });
    setIncidents(reports.length);
  }, [configuration.tenantId, territory.territoryId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const announcements: TerritoryAnnouncement[] = pulse?.important ?? [];

  return (
    <AdminOperationsShell title="Operaciones del territorio" section="operations">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Próximos planes", today?.experiences ?? 0],
          ["Avisos", today?.announcements ?? 0],
          ["Reservas", today?.reservations ?? 0],
          ["Ayuda", today?.help ?? 0],
          ["Servicios", today?.services ?? 0],
          ["Incidencias", incidents],
        ].map(([label, value]) => (
          <AdminCard key={String(label)} title={String(label)}>
            <p className="text-[22px] font-semibold text-[var(--color-text-primary)]">
              {value}
            </p>
          </AdminCard>
        ))}
      </div>
      <AdminCard title="Avisos del territorio">
        <ul className="space-y-2 text-[14px] text-[var(--color-text-secondary)]">
          {announcements.map((item) => (
            <li key={item.id}>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {item.title}
              </span>
              <span className="mt-0.5 block">{item.body}</span>
            </li>
          ))}
          {announcements.length === 0 ? (
            <li>No hay avisos publicados.</li>
          ) : null}
        </ul>
        <label className="mt-4 block space-y-1.5">
          <span className="text-[13px] font-medium">Nuevo aviso</span>
          <input
            className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <textarea
          className="mt-2 min-h-[88px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3 py-2"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        {error ? (
          <p className="mt-2 text-[13px] text-[var(--color-feedback-danger)]">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-3 rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[13px] font-semibold text-white"
          onClick={() => {
            void createTerritoryAnnouncementRequest({
              tenantId: configuration.tenantId,
              title,
              body,
            }).then((result) => {
              if ("error" in result) {
                setError("No se pudo publicar.");
                return;
              }
              setTitle("");
              setBody("");
              setError(null);
              void refresh();
            });
          }}
        >
          Publicar aviso
        </button>
      </AdminCard>
    </AdminOperationsShell>
  );
}
