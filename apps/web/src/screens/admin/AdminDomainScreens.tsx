"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@life-community-os/types";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

export function AdminHousingScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/housing?tenantId=${encodeURIComponent(tenantSlug)}`, {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { properties?: Property[] };
      setProperties(data.properties ?? []);
    })();
  }, [tenantSlug]);

  return (
    <AdminOperationsShell title="Housing" section="housing">
      <AdminCard title="Propiedades del tenant">
        {properties.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No hay viviendas registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {properties.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full rounded-[12px] border px-3 py-2 text-left"
                  onClick={() => router.push(`/housing/${item.id}`)}
                >
                  <span className="block text-[15px] font-medium">{item.title ?? item.name}</span>
                  <span className="block text-[13px] text-[var(--color-text-tertiary)]">
                    {item.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminOperationsShell>
  );
}

export function AdminCommunityScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/moderation", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { posts?: unknown[] };
      setCount(data.posts?.length ?? 0);
    })();
  }, [tenantSlug]);

  return (
    <AdminOperationsShell title="Community" section="community">
      <AdminCard title="Actividad">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {count == null
            ? "Cargando publicaciones del tenant…"
            : `${count} publicaciones. La moderación vive en Moderation Center.`}
        </p>
        <button
          type="button"
          className="mt-3 min-h-[40px] rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white"
          onClick={() => router.push("/admin/moderation")}
        >
          Abrir moderación
        </button>
        <button
          type="button"
          className="mt-2 min-h-[40px] w-full rounded-full border px-4 text-[13px]"
          onClick={() => router.push("/community")}
        >
          Ver comunidad
        </button>
      </AdminCard>
    </AdminOperationsShell>
  );
}

export function AdminMarketplaceScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [listings, setListings] = useState<number | null>(null);
  const [help, setHelp] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/moderation", {
        cache: "no-store",
        headers: { "x-tenant-slug": tenantSlug },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        listings?: unknown[];
        help?: unknown[];
      };
      setListings(data.listings?.length ?? 0);
      setHelp(data.help?.length ?? 0);
    })();
  }, [tenantSlug]);

  return (
    <AdminOperationsShell title="Marketplace" section="marketplace">
      <AdminCard title="Anuncios y ayuda">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {listings == null
            ? "Cargando…"
            : `${listings} anuncios · ${help} solicitudes de ayuda.`}
        </p>
        <button
          type="button"
          className="mt-3 min-h-[40px] rounded-full border px-4 text-[13px]"
          onClick={() => router.push("/admin/moderation")}
        >
          Moderar contenido
        </button>
      </AdminCard>
    </AdminOperationsShell>
  );
}
