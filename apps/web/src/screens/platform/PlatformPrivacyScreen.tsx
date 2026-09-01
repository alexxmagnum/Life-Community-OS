"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  PlatformAuditRecord,
  PrivacyConfiguration,
} from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

export function PlatformPrivacyScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [configurations, setConfigurations] = useState<PrivacyConfiguration[]>(
    [],
  );
  const [audit, setAudit] = useState<PlatformAuditRecord[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [legalContact, setLegalContact] = useState("");
  const [dataControllerName, setDataControllerName] = useState("");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/platform/privacy", { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as {
      configurations?: PrivacyConfiguration[];
      audit?: PlatformAuditRecord[];
    };
    setConfigurations(data.configurations ?? []);
    setAudit(data.audit ?? []);
    setForbidden(false);
    if (!selectedTenant && data.configurations?.length) {
      setSelectedTenant(data.configurations[0]?.tenantId ?? "");
    }
  }, [selectedTenant]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const row = configurations.find((item) => item.tenantId === selectedTenant);
    if (!row) return;
    setLegalContact(row.legalContact ?? "");
    setDataControllerName(row.dataControllerName ?? "");
    setPrivacyPolicyUrl(row.privacyPolicyUrl ?? "");
  }, [configurations, selectedTenant]);

  if (!currentUser.authenticated || forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Privacy Governance"
          onBack={() => router.push("/platform/admin")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso de plataforma"
          description="Solo operadores SaaS pueden gestionar la gobernanza global de privacidad."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Privacy Governance"
        subtitle="Control plane GDPR"
        onBack={() => router.push("/platform/admin")}
        onExit={() => router.push("/")}
      />
      <p className="mt-3 text-[13px] text-[var(--color-text-tertiary)]">
        Life Community OS es proveedor tecnológico. Cada tenant es responsable
        local del tratamiento.
      </p>
      <Link
        href="/platform/admin"
        className="mt-2 inline-block text-[13px] text-[var(--color-action-primary)]"
      >
        ← Platform Admin
      </Link>
      <section className="mt-6 space-y-2">
        <p className="text-[13px] font-semibold">Configuración por tenant</p>
        <select
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          value={selectedTenant}
          onChange={(event) => setSelectedTenant(event.target.value)}
        >
          {configurations.map((row) => (
            <option key={row.tenantId} value={row.tenantId}>
              {row.tenantId}
            </option>
          ))}
        </select>
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Responsable del tratamiento"
          value={dataControllerName}
          onChange={(event) => setDataControllerName(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Contacto legal"
          value={legalContact}
          onChange={(event) => setLegalContact(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="URL política de privacidad"
          value={privacyPolicyUrl}
          onChange={(event) => setPrivacyPolicyUrl(event.target.value)}
        />
        {message ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">{message}</p>
        ) : null}
        <button
          type="button"
          className="rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[13px] font-semibold text-white"
          onClick={() => {
            void fetch("/api/platform/privacy", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                tenantId: selectedTenant,
                dataControllerName,
                legalContact,
                privacyPolicyUrl,
              }),
            }).then((res) => {
              if (!res.ok) {
                setMessage("No se pudo guardar.");
                return;
              }
              setMessage("Configuración guardada.");
              void refresh();
            });
          }}
        >
          Guardar configuración
        </button>
      </section>
      <section className="mt-6">
        <p className="text-[13px] font-semibold">Auditoría de privacidad</p>
        <ul className="mt-2 space-y-2 text-[13px] text-[var(--color-text-secondary)]">
          {audit.length === 0 ? (
            <li>Sin eventos registrados.</li>
          ) : (
            audit.slice(0, 20).map((row, index) => (
              <li
                key={`${row.action}-${row.timestamp}-${index}`}
                className="rounded-[12px] border border-[var(--color-border-glass)] px-3 py-2"
              >
                {row.action} · {row.tenantId} · {row.timestamp}
              </li>
            ))
          )}
        </ul>
      </section>
    </MobileScreen>
  );
}
