"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomerOperationsContext } from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

export function PlatformCustomersScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [customers, setCustomers] = useState<CustomerOperationsContext[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [adminEmail, setAdminEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/platform/customers", { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as {
      customers?: CustomerOperationsContext[];
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

  if (!currentUser.authenticated || forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Customer Operations"
          onBack={() => router.push("/platform/admin")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso de plataforma"
          description="Solo operadores SaaS pueden gestionar clientes comerciales."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Customer Operations"
        subtitle="Alta y despliegue comercial"
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
                <span className="font-semibold">{row.companyName}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--color-text-tertiary)]">
                  {row.tenantId} · {row.onboardingStatus} · plan {row.plan}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {selectedCustomer ? (
        <section className="mt-6 space-y-2">
          <p className="text-[13px] font-semibold">Operaciones</p>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Config: {selectedCustomer.configurationStatus} · Billing:{" "}
            {selectedCustomer.subscription?.billingProvider ?? "none"}
          </p>
          <input
            className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
            placeholder="Email administrador"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
          />
          {message ? (
            <p className="text-[13px] text-[var(--color-text-secondary)]">{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
              onClick={() => {
                void fetch("/api/platform/customers", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    action: "configure",
                    tenantId: selectedCustomer.tenantId,
                  }),
                }).then((res) => {
                  setMessage(res.ok ? "Configurando cliente." : "Error.");
                  void refresh();
                });
              }}
            >
              Configurar
            </button>
            <button
              type="button"
              className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-[12px] font-semibold"
              onClick={() => {
                void fetch("/api/platform/customers", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    action: "invite_administrator",
                    tenantId: selectedCustomer.tenantId,
                    email: adminEmail,
                  }),
                }).then((res) => {
                  setMessage(res.ok ? "Invitación registrada." : "Error.");
                  void refresh();
                });
              }}
            >
              Invitar admin
            </button>
            <button
              type="button"
              className="rounded-full bg-[var(--color-action-primary)] px-3 py-1 text-[12px] font-semibold text-white"
              onClick={() => {
                void fetch("/api/platform/customers", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    action: "complete",
                    tenantId: selectedCustomer.tenantId,
                  }),
                }).then((res) => {
                  setMessage(res.ok ? "Cliente listo." : "Error.");
                  void refresh();
                });
              }}
            >
              Marcar ready
            </button>
          </div>
        </section>
      ) : null}
    </MobileScreen>
  );
}
