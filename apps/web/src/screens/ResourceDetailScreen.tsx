"use client";

import { useRouter } from "next/navigation";
import { getResourceById } from "@life-community-os/tenant-life-panoramica";
import {
  Button,
  EmptyState,
  ResourceHero,
  ReservationStatusBadge,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function ResourceDetailScreen({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const { theme, isFeatureEnabled, hasCapability } = useTenant();

  if (!isFeatureEnabled("resources")) {
    return (
      <EmptyState
        title="Places aren’t available"
        actionLabel="Back home"
        onAction={() => router.push("/")}
      />
    );
  }

  const resource = getResourceById(resourceId);

  if (!resource) {
    return (
      <EmptyState
        title="Place not found"
        actionLabel="Browse places"
        onAction={() => router.push("/resources")}
      />
    );
  }

  if (!hasCapability(CAPABILITIES.resourceView)) {
    return (
      <EmptyState
        title="You don’t have access"
        description="You can’t view this place right now."
      />
    );
  }

  const canReserve = hasCapability(CAPABILITIES.resourceReserve);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-[15px] font-semibold text-[var(--color-action-primary)]"
      >
        ← Back
      </button>

      <ResourceHero
        imageUrl={resource.imageUrl}
        name={resource.name}
        overline={theme.logoText}
      />

      <div className="flex flex-wrap items-center gap-3">
        <ReservationStatusBadge status="available" />
        <span className="text-[14px] text-[var(--color-text-secondary)]">
          Next opening · {resource.availabilityPreview}
        </span>
        {hasCapability(CAPABILITIES.resourceManage) ? (
          <span className="text-[13px] font-semibold text-[var(--color-text-tertiary)]">
            Manage available
          </span>
        ) : null}
      </div>

      <p className="text-[17px] leading-7 text-[var(--color-text-secondary)]">
        {resource.description}
      </p>

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Where
        </h2>
        <p className="mt-1 text-[17px] font-semibold">{resource.location}</p>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          {resource.areaLabel}
        </p>
      </section>

      <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-elev-1)]">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Community rules
        </h2>
        <ul className="mt-3 space-y-2">
          {resource.rules.map((rule) => (
            <li
              key={rule}
              className="text-[15px] leading-6 text-[var(--color-text-secondary)]"
            >
              · {rule}
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-[88px] z-20 space-y-3 rounded-[var(--radius-xl)] bg-[var(--color-surface-app)]/95 p-3 backdrop-blur md:static md:bg-transparent md:p-0">
        {canReserve ? (
          <Button
            fullWidth
            onClick={() =>
              router.push(`/resources/${resource.id}/availability`)
            }
          >
            Reserve
          </Button>
        ) : (
          <Button fullWidth disabled>
            Reserve unavailable
          </Button>
        )}
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            router.push(`/resources/${resource.id}/availability`)
          }
        >
          View availability
        </Button>
      </div>
    </div>
  );
}
