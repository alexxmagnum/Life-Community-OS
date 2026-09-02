"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatContentWhen } from "@life-community-os/tenant-life-panoramica";
import {
  helpRequestTypeLabel,
  isWorkHelpCategory,
  type HelpRequest,
} from "@life-community-os/types";
import {
  Avatar,
  EmptyState,
  FlowScreenHeader,
  MobileScreen,
} from "@life-community-os/ui";
import { fetchHelpRequest } from "@/lib/marketplace/commerce-client";
import {
  visitorConversionHref,
  visitorConversionLabel,
} from "@/lib/membership/visitor-experience";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

export function HelpDetailScreen({ helpId }: { helpId: string }) {
  const router = useRouter();
  const {
    configuration,
    authenticated,
    hasMembership,
    hasCapability,
  } = useTenant();
  const [item, setItem] = useState<HelpRequest | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await fetchHelpRequest(configuration.tenantId, helpId);
      if (cancelled) return;
      if (row && isWorkHelpCategory(row.category)) {
        router.replace(`/services/work/${helpId}`);
        return;
      }
      setItem(row);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, helpId, router]);

  if (!ready) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Ayuda entre vecinos"
          onBack={() => router.push("/community")}
          onExit={() => router.push("/community")}
        />
      </MobileScreen>
    );
  }

  if (!item) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Ayuda entre vecinos"
          onBack={() => router.push("/community")}
          onExit={() => router.push("/community")}
        />
        <EmptyState
          title="Ayuda no encontrada"
          description="Puede haberse cerrado o el enlace no es válido."
          actionLabel="Ver comunidad"
          onAction={() => router.push("/community")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.localView) || !authenticated || !hasMembership) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Ayuda entre vecinos"
          onBack={() => router.push("/community")}
          onExit={() => router.push("/community")}
        />
        <EmptyState
          title="Únete para participar"
          description="Vecinos ayudando vecinos. Crea tu cuenta y únete a la comunidad para ver y responder ayudas."
          actionLabel={visitorConversionLabel(authenticated)}
          onAction={() => router.push(visitorConversionHref(authenticated))}
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={item.title}
        subtitle={helpRequestTypeLabel(item.type)}
        onBack={() => router.push("/community")}
        onExit={() => router.push("/community")}
      />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-text-primary)]">
            {helpRequestTypeLabel(item.type)}
          </span>
          <span className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
            {item.category}
          </span>
        </div>
        <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
          {item.description}
        </p>
      </header>

      <section className="flex items-center gap-3 rounded-[14px] bg-[var(--color-surface-elevated)] px-3.5 py-3 shadow-[var(--shadow-elev-1)]">
        <Avatar alt={item.authorDisplayName} size="md" zoomable={false} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {item.authorDisplayName}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            {formatContentWhen(item.createdAt)}
          </p>
        </div>
      </section>
    </MobileScreen>
  );
}
