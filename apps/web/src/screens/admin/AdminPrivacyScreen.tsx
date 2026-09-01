"use client";

import { useCallback, useEffect, useState } from "react";
import type { PrivacyConfiguration } from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

export function AdminPrivacyScreen() {
  const { tenantSlug } = useTenant();
  const [configuration, setConfiguration] = useState<PrivacyConfiguration | null>(
    null,
  );
  const [legalContact, setLegalContact] = useState("");
  const [dataControllerName, setDataControllerName] = useState("");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/privacy", {
      cache: "no-store",
      headers: { "x-tenant-slug": tenantSlug },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { configuration?: PrivacyConfiguration };
    const config = data.configuration ?? null;
    setConfiguration(config);
    setLegalContact(config?.legalContact ?? "");
    setDataControllerName(config?.dataControllerName ?? "");
    setPrivacyPolicyUrl(config?.privacyPolicyUrl ?? "");
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Privacy" section="privacy">
      <AdminCard title="Responsabilidad local">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Este tenant configura contacto legal y política de privacidad. No puede
          exportar datos de otros usuarios ni acceder a mensajes privados.
        </p>
      </AdminCard>
      <AdminCard title="Configuración permitida">
        <div className="space-y-2">
          <input
            className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-transparent px-3"
            placeholder="Responsable del tratamiento"
            value={dataControllerName}
            onChange={(event) => setDataControllerName(event.target.value)}
          />
          <input
            className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-transparent px-3"
            placeholder="Contacto legal"
            value={legalContact}
            onChange={(event) => setLegalContact(event.target.value)}
          />
          <input
            className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-transparent px-3"
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
              void fetch("/api/admin/privacy", {
                method: "PATCH",
                headers: {
                  "content-type": "application/json",
                  "x-tenant-slug": tenantSlug,
                },
                body: JSON.stringify({
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
            Guardar
          </button>
        </div>
      </AdminCard>
      {configuration ? (
        <AdminCard title="Retención (contrato)">
          <ul className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
            {Object.values(configuration.retentionSettings).map((rule) => (
              <li key={rule.domain}>
                <span className="font-medium">{rule.domain}</span> —{" "}
                {rule.description}
                {rule.automaticDeletion ? " · borrado automático" : " · sin borrado automático"}
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}
    </AdminOperationsShell>
  );
}
