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
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

function typeLabel(item: HelpRequest): string {
  if (isWorkHelpCategory(item.category)) {
    return item.type === "need_help" ? "Busco trabajo" : "Ofrezco trabajo";
  }
  return helpRequestTypeLabel(item.type);
}

function boardHref(item: HelpRequest | null): string {
  if (item && !isWorkHelpCategory(item.category)) {
    return "/services/neighbour-help";
  }
  return "/services/work";
}

export function WorkPostDetailScreen({ workPostId }: { workPostId: string }) {
  const router = useRouter();
  const {
    configuration,
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
  } = useTenant();
  const [item, setItem] = useState<HelpRequest | null>(null);
  const [ready, setReady] = useState(false);

  const workEnabled =
    isModuleEnabled("services") &&
    (isFeatureEnabled("work") || isFeatureEnabled("services"));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await fetchHelpRequest(configuration.tenantId, workPostId);
      if (cancelled) return;
      setItem(row);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [configuration.tenantId, workPostId]);

  if (!workEnabled) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Ayuda"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="No disponible"
          description="Este tablón no está activo en tu comunidad ahora mismo."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!ready) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Anuncio"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!item) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title="Anuncio"
          onBack={() => router.push("/services")}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Anuncio no encontrado"
          description="Puede haberse cerrado o el enlace no es válido."
          actionLabel="Ver servicios"
          onAction={() => router.push("/services")}
        />
      </MobileScreen>
    );
  }

  if (!hasCapability(CAPABILITIES.localView)) {
    return (
      <MobileScreen>
        <FlowScreenHeader
          title={typeLabel(item)}
          onBack={() => router.push(boardHref(item))}
          onExit={() => router.push("/services")}
        />
        <EmptyState
          title="Sin acceso"
          description="No puedes ver este anuncio con tu cuenta actual."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen dense>
      <FlowScreenHeader
        title={item.title}
        subtitle={typeLabel(item)}
        onBack={() => router.push(boardHref(item))}
        onExit={() => router.push("/services")}
      />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-action-primary-subtle)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-text-primary)]">
            {typeLabel(item)}
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
