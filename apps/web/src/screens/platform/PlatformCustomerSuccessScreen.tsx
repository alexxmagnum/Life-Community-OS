"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomerSuccessContext } from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

function healthLabel(status: string): string {
  switch (status) {
    case "healthy":
      return "Active";
    case "attention_required":
      return "Attention Required";
    case "blocked":
      return "Blocked";
    case "critical":
      return "Critical";
    default:
      return status;
  }
}

export function PlatformCustomerSuccessScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [customers, setCustomers] = useState<CustomerSuccessContext[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/platform/customer-success", {
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as {
      customers?: CustomerSuccessContext[];
    };
    setCustomers(data.customers ?? []);
    setForbidden(false);
    if (!selected && data.customers?.length) {
      setSelected(data.customers[0]!.tenantId);
    }
  }, [selected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedCustomer = customers.find((row) => row.tenantId === selected);

  async function createSupportNote() {
    if (!selected || !note.trim()) return;
    const res = await fetch("/api/platform/customer-success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_support_note",
        tenantId: selected,
        summary: note.trim(),
      }),
    });
    if (!res.ok) {
      setMessage("No se pudo registrar la incidencia.");
      return;
    }
    setNote("");
    setMessage("Incidencia registrada.");
    await refresh();
  }

  if (!currentUser.authenticated || forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Customer Success"
          onBack={() => router.push("/platform/admin")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso de plataforma"
          description="Solo operadores SaaS pueden operar customer success."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Customer Success"
        subtitle="Operación continua SaaS"
        onBack={() => router.push("/platform/admin")}
        onExit={() => router.push("/")}
      />
      <Link
        href="/platform/admin"
        className="mt-2 inline-block text-[13px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Platform Admin
      </Link>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Clientes SaaS</p>
        <ul className="mt-2 space-y-2 text-[13px]">
          {customers.map((row) => (
            <li
              key={row.tenantId}
              className="rounded-[12px] border border-[var(--color-border-glass)] px-3 py-2"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setSelected(row.tenantId)}
              >
                <span className="font-semibold">{row.tenantId}</span>
                <span className="ml-2 text-[12px] text-[var(--color-text-secondary)]">
                  {healthLabel(row.health.status)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {selectedCustomer ? (
        <section className="mt-6 space-y-4 text-[13px]">
          <div>
            <p className="font-semibold">Estado operativo</p>
            <p>{healthLabel(selectedCustomer.health.status)}</p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Lifecycle: {selectedCustomer.lifecycleStatus}
            </p>
          </div>
          <div>
            <p className="font-semibold">Onboarding</p>
            <p>
              {selectedCustomer.onboardingProgress.completedCount}/
              {selectedCustomer.onboardingProgress.totalCount} completado
            </p>
            <ul className="mt-1 space-y-1">
              {selectedCustomer.onboardingProgress.items.map((item) => (
                <li key={item.key}>
                  {item.label}: {item.status}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Alertas operativas</p>
            {selectedCustomer.operationalAlerts.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Sin alertas abiertas
              </p>
            ) : (
              <ul className="mt-1 space-y-1">
                {selectedCustomer.operationalAlerts.map((alert) => (
                  <li key={alert.id}>
                    [{alert.type}] {alert.summary}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-semibold">Soporte operativo</p>
            <textarea
              className="mt-1 w-full rounded-[8px] border border-[var(--color-border-glass)] p-2"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Registrar incidencia operativa"
            />
            <button
              type="button"
              className="mt-2 rounded-[8px] bg-[var(--color-action-primary)] px-3 py-2 text-[13px] font-semibold text-white"
              onClick={() => void createSupportNote()}
            >
              Registrar incidencia
            </button>
          </div>
        </section>
      ) : null}
      {message ? (
        <p className="mt-4 text-[13px] text-[var(--color-text-secondary)]">
          {message}
        </p>
      ) : null}
    </MobileScreen>
  );
}
