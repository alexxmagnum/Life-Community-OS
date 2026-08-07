"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listResources } from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  LoadingState,
  ResourceDiscoveryCard,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function ResourceDiscoveryScreen() {
  const router = useRouter();
  const { isFeatureEnabled, hasCapability } = useTenant();
  const [query, setQuery] = useState("");
  const [loading] = useState(false);

  const items = useMemo(() => {
    return listResources().filter((r) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.areaLabel.toLowerCase().includes(q)
      );
    });
  }, [query]);

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Places aren’t available"
        description="This community hasn’t enabled shared resources yet."
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceView)) {
    return (
      <EmptyState
        title="You don’t have access"
        description="Shared places aren’t available for your account."
      />
    );
  }

  if (loading) return <LoadingState label="Loading places" />;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Discover
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-[28px] font-semibold">
          Places
        </h1>
        <p className="mt-2 text-[16px] text-[var(--color-text-secondary)]">
          Shared spaces you can reserve in your community.
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Search places</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courts, rooms, terraces…"
          className="min-h-[48px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-4 text-[16px] outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
        />
      </label>

      {items.length === 0 ? (
        <EmptyState
          title="No places match"
          description="Try another search."
          actionLabel="Clear"
          onAction={() => setQuery("")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((resource) => {
            const href = `/resources/${resource.id}`;
            const canReserve = hasCapability(CAPABILITIES.resourceReserve);
            return (
              <ResourceDiscoveryCard
                key={resource.id}
                name={resource.name}
                description={resource.description}
                availability={resource.availabilityPreview}
                area={resource.areaLabel}
                imageUrl={resource.imageUrl}
                onClick={() => router.push(href)}
                onReserve={
                  canReserve
                    ? () => router.push(`${href}/availability`)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
