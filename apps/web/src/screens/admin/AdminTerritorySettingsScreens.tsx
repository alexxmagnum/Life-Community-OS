"use client";

import { useCallback, useEffect, useState } from "react";
import type { TerritoryObject } from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

type Assignment = { territoryObjectId: string; spatialAssetId: string };
type AssetOpt = { id: string; name: string; category: string };

export function AdminTerritoryScreen() {
  const { tenantSlug } = useTenant();
  const [objects, setObjects] = useState<TerritoryObject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assets, setAssets] = useState<AssetOpt[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/territory", {
      cache: "no-store",
      headers: { "x-tenant-slug": tenantSlug },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      objects?: TerritoryObject[];
      assignments?: Assignment[];
      assets?: AssetOpt[];
    };
    setObjects(data.objects ?? []);
    setAssignments(data.assignments ?? []);
    setAssets(data.assets ?? []);
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Territory Manager" section="territory">
      <AdminCard title="TerritoryObjects">
        {objects.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Este tenant no tiene objetos territoriales.
          </p>
        ) : (
          <ul className="space-y-2">
            {objects.map((object) => {
              const current =
                assignments.find((item) => item.territoryObjectId === object.id)
                  ?.spatialAssetId ??
                object.asset?.key ??
                "";
              return (
                <li
                  key={object.id}
                  className="rounded-[12px] border px-3 py-2"
                >
                  <p className="text-[15px] font-medium">
                    {object.label ?? object.type}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-tertiary)]">
                    {object.type} · {object.id}
                  </p>
                  <select
                    className="mt-2 min-h-[36px] w-full rounded-[10px] border bg-transparent px-2"
                    value={current}
                    onChange={(e) =>
                      void fetch("/api/admin/territory", {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-tenant-slug": tenantSlug,
                        },
                        body: JSON.stringify({
                          territoryObjectId: object.id,
                          spatialAssetId: e.target.value,
                        }),
                      }).then(() => refresh())
                    }
                  >
                    <option value="">Sin SpatialAsset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.category})
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </AdminOperationsShell>
  );
}

export function AdminSettingsScreen() {
  const { tenantSlug } = useTenant();
  const [locale, setLocale] = useState("");
  const [timezone, setTimezone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [tagline, setTagline] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/settings", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        contract: {
          locale: string;
          timezone: string;
          contactEmail: string | null;
          branding: { tagline?: string };
        };
      };
      setLocale(data.contract.locale);
      setTimezone(data.contract.timezone);
      setContactEmail(data.contract.contactEmail ?? "");
      setTagline(data.contract.branding.tagline ?? "");
    })();
  }, [tenantSlug]);

  return (
    <AdminOperationsShell title="Settings" section="settings">
      <AdminCard title="Configuración del tenant">
        <p className="mb-3 text-[13px] text-[var(--color-text-secondary)]">
          Identidad global del producto no es editable. Solo overlay operativo.
        </p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "x-tenant-slug": tenantSlug,
                },
                body: JSON.stringify({
                  locale,
                  timezone,
                  contactEmail,
                  tagline,
                }),
              });
              setMessage(
                res.status === 403
                  ? "Identidad de producto bloqueada o permiso denegado."
                  : res.ok
                    ? "Guardado."
                    : "No se pudo guardar.",
              );
            })();
          }}
        >
          <label className="block text-[13px]">
            Locale
            <input
              className="mt-1 min-h-[40px] w-full rounded-[12px] border px-3"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            />
          </label>
          <label className="block text-[13px]">
            Timezone
            <input
              className="mt-1 min-h-[40px] w-full rounded-[12px] border px-3"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </label>
          <label className="block text-[13px]">
            Contacto
            <input
              className="mt-1 min-h-[40px] w-full rounded-[12px] border px-3"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </label>
          <label className="block text-[13px]">
            Tagline
            <input
              className="mt-1 min-h-[40px] w-full rounded-[12px] border px-3"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-[12px] bg-[var(--color-action-primary)] text-[15px] font-semibold text-white"
          >
            Guardar
          </button>
        </form>
        {message ? (
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            {message}
          </p>
        ) : null}
      </AdminCard>
    </AdminOperationsShell>
  );
}
