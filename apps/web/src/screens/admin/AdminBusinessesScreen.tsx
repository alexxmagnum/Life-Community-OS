"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@life-community-os/types";
import {
  businessLifecycleLabel,
  canAdminApproveBusiness,
  canAdminRejectBusiness,
} from "@life-community-os/types";
import { fetchBusinesses, reviewBusinessRequest } from "@/lib/business/business-client";
import { AdminCard, AdminOperationsShell } from "@/components/admin/AdminOperationsShell";
import { useTenant } from "@/providers/TenantProvider";

export function AdminBusinessesScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [items, setItems] = useState<BusinessProfile[]>([]);

  const refresh = useCallback(async () => {
    const [pending, drafts, published, suspended] = await Promise.all([
      fetchBusinesses({ tenantId: tenantSlug, status: "pending_review" }),
      fetchBusinesses({ tenantId: tenantSlug, status: "draft" }),
      fetchBusinesses({ tenantId: tenantSlug, status: "published" }),
      fetchBusinesses({ tenantId: tenantSlug, status: "suspended" }),
    ]);
    const seen = new Set<string>();
    setItems(
      [...pending, ...drafts, ...published, ...suspended].filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      }),
    );
  }, [tenantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminOperationsShell title="Negocios" section="businesses">
      <AdminCard title={`Cola operacional (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            No hay negocios en este tenant.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-[12px] border border-[var(--color-border-subtle)] px-3 py-2"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => router.push(`/locations/${item.locationId}`)}
                >
                  <span className="block text-[15px] font-medium">{item.name}</span>
                  <span className="block text-[13px] text-[var(--color-text-tertiary)]">
                    {businessLifecycleLabel(item.status)} · {item.category}
                  </span>
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  {canAdminApproveBusiness(item.status) ? (
                    <button
                      type="button"
                      className="min-h-[36px] rounded-full bg-[var(--color-action-primary)] px-3 text-[13px] font-semibold text-white"
                      onClick={() =>
                        void reviewBusinessRequest({
                          tenantId: tenantSlug,
                          businessId: item.id,
                          action: "approve",
                        }).then(() => refresh())
                      }
                    >
                      Aprobar
                    </button>
                  ) : null}
                  {canAdminRejectBusiness(item.status) ? (
                    <button
                      type="button"
                      className="min-h-[36px] rounded-full border px-3 text-[13px]"
                      onClick={() =>
                        void reviewBusinessRequest({
                          tenantId: tenantSlug,
                          businessId: item.id,
                          action: "reject",
                        }).then(() => refresh())
                      }
                    >
                      Rechazar
                    </button>
                  ) : null}
                  {item.status === "published" ? (
                    <button
                      type="button"
                      className="min-h-[36px] rounded-full border px-3 text-[13px]"
                      onClick={() =>
                        void reviewBusinessRequest({
                          tenantId: tenantSlug,
                          businessId: item.id,
                          action: "suspend",
                        }).then(() => refresh())
                      }
                    >
                      Suspender
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="min-h-[36px] rounded-full border px-3 text-[13px]"
                    onClick={() => router.push(`/locations/${item.locationId}`)}
                  >
                    Editar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminOperationsShell>
  );
}
