"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COMMUNITY_ONBOARDING_STEPS,
  type ProvisionedTenant,
} from "@life-community-os/types";
import { EmptyState, FlowScreenHeader, MobileScreen } from "@life-community-os/ui";
import { useCurrentUser } from "@/providers/CurrentUserProvider";

export function PlatformAdminScreen() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [tenants, setTenants] = useState<ProvisionedTenant[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [territoryName, setTerritoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/platform/tenants", { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      setForbidden(true);
      setTenants([]);
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as { tenants?: ProvisionedTenant[] };
    setTenants(data.tenants ?? []);
    setForbidden(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!currentUser.authenticated || forbidden) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Platform Admin"
          onBack={() => router.push("/")}
          onExit={() => router.push("/")}
        />
        <EmptyState
          title="Acceso de plataforma"
          description="Este espacio gestiona el SaaS. No es el admin de una comunidad."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <FlowScreenHeader
        title="Platform Admin"
        subtitle="Fábrica de comunidades"
        onBack={() => router.push("/")}
        onExit={() => router.push("/")}
      />
      <p className="mt-3 text-[13px] text-[var(--color-text-tertiary)]">
        PLATFORM → TENANT → TERRITORY. Distinto de /admin/operations.
      </p>
      <ol className="mt-4 space-y-1 text-[13px] text-[var(--color-text-secondary)]">
        {COMMUNITY_ONBOARDING_STEPS.map((step) => (
          <li key={step}>{step.replaceAll("_", " ")}</li>
        ))}
      </ol>
      <section className="mt-6 space-y-2">
        <p className="text-[13px] font-semibold">Nueva comunidad</p>
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
        <input
          className="min-h-[44px] w-full rounded-[12px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-3"
          placeholder="Territory inicial"
          value={territoryName}
          onChange={(event) => setTerritoryName(event.target.value)}
        />
        {error ? (
          <p className="text-[13px] text-[var(--color-feedback-danger)]">{error}</p>
        ) : null}
        <button
          type="button"
          className="rounded-full bg-[var(--color-action-primary)] px-4 py-2 text-[13px] font-semibold text-white"
          onClick={() => {
            void fetch("/api/platform/tenants", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name,
                slug,
                locale: "en",
                timezone: "UTC",
                territories: [{ name: territoryName || name }],
              }),
            }).then((res) => {
              if (!res.ok) {
                setError("No se pudo crear.");
                return;
              }
              setName("");
              setSlug("");
              setTerritoryName("");
              setError(null);
              void refresh();
            });
          }}
        >
          Crear Tenant
        </button>
      </section>
      <ul className="mt-6 space-y-2 text-[14px]">
        {tenants.map((tenant) => (
          <li
            key={tenant.id}
            className="rounded-[16px] border border-[var(--color-border-glass)] px-4 py-3"
          >
            <span className="font-semibold">{tenant.name}</span>
            <span className="mt-0.5 block text-[12px] text-[var(--color-text-tertiary)]">
              {tenant.slug} · {tenant.plan} · {tenant.locale}
            </span>
          </li>
        ))}
      </ul>
    </MobileScreen>
  );
}
