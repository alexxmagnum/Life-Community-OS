"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommunityResource, Reservation } from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

export function AdminResourcesScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [name, setName] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/resources?tenantId=${encodeURIComponent(tenantSlug)}`, {
      cache: "no-store",
      headers: { "x-tenant-slug": tenantSlug },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { resources?: CommunityResource[] };
    setResources(data.resources ?? []);
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Recursos" section="resources">
      <AdminCard title="Inventario">
        <ul className="space-y-2">
          {resources.length === 0 ? (
            <li className="text-[13px] text-[var(--color-text-secondary)]">
              No hay recursos en este tenant.
            </li>
          ) : (
            resources.map((item) => (
              <li
                key={item.id}
                className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
              >
                <p className="text-[15px] font-medium">{item.name}</p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {item.status} · {item.category}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["active", "inactive", "maintenance"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="min-h-[32px] rounded-full border px-3 text-[12px]"
                      onClick={() =>
                        void fetch(`/api/resources/${item.id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            "x-tenant-slug": tenantSlug,
                          },
                          body: JSON.stringify({ status }),
                        }).then(() => refresh())
                      }
                    >
                      {status}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="min-h-[32px] rounded-full border px-3 text-[12px]"
                    onClick={() => router.push(`/resources/${item.id}`)}
                  >
                    Abrir
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </AdminCard>
      <AdminCard title="Crear recurso">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void fetch("/api/resources", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-slug": tenantSlug,
              },
              body: JSON.stringify({
                tenantId: tenantSlug,
                name,
                description: name,
                category: "space",
              }),
            }).then(() => {
              setName("");
              return refresh();
            });
          }}
        >
          <input
            className="min-h-[44px] flex-1 rounded-[12px] border px-3"
            placeholder="Sala / piscina / pista"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="min-h-[44px] rounded-[12px] bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
          >
            Crear
          </button>
        </form>
      </AdminCard>
    </AdminOperationsShell>
  );
}

export function AdminReservationsScreen() {
  const { tenantSlug } = useTenant();
  const [rows, setRows] = useState<Reservation[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch(
      `/api/reservations?tenantId=${encodeURIComponent(tenantSlug)}&mine=0`,
      { cache: "no-store", headers: { "x-tenant-slug": tenantSlug } },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { reservations?: Reservation[] };
    setRows(data.reservations ?? []);
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Reservas" section="reservations">
      <AdminCard title="Agenda">
        {rows.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No hay reservas próximas ni históricas en este tenant.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((item) => (
              <li
                key={item.id}
                className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
              >
                <p className="text-[15px] font-medium">
                  {item.date} · {item.start}–{item.end}
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {item.status} · {item.resourceId}
                </p>
                {item.status !== "cancelled" ? (
                  <button
                    type="button"
                    className="mt-2 min-h-[32px] rounded-full border px-3 text-[12px]"
                    onClick={() =>
                      void fetch(`/api/reservations/${item.id}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-tenant-slug": tenantSlug,
                        },
                        body: JSON.stringify({ status: "cancelled" }),
                      }).then(() => refresh())
                    }
                  >
                    Cancelar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminOperationsShell>
  );
}
