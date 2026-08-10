"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getTerritoryAccessContext,
  servicesCategoryHubs,
} from "@life-community-os/tenant-life-panoramica";
import {
  EmptyState,
  MobileScreen,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type ServiceEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  tint: string;
};

/**
 * Servicios nav hub — “Necesito resolver algo”.
 * Category doors only. Territory/local-life discovery does not belong here.
 */
export function ServicesHubScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    demoPersonId,
  } = useTenant();

  const territoryAccess = useMemo(
    () =>
      getTerritoryAccessContext(demoPersonId, {
        canReservePermission: hasCapability(CAPABILITIES.resourceReserve),
      }),
    [demoPersonId, hasCapability],
  );

  const entries = useMemo((): ServiceEntry[] => {
    const cards: ServiceEntry[] = [];

    if (!isModuleEnabled("services")) return cards;

    for (const hub of servicesCategoryHubs) {
      const flagsOk = hub.featureKeys.some((key) => isFeatureEnabled(key));
      if (!flagsOk) continue;
      cards.push({
        id: hub.slug,
        title: hub.label,
        description: copyForServiceSlug(hub.slug, hub.description),
        href: `/services/${hub.slug}`,
        icon: iconForServiceSlug(hub.slug),
        tint: tintForServiceSlug(hub.slug),
      });
    }

    if (isModuleEnabled("marketplace") && isFeatureEnabled("marketplace")) {
      cards.push({
        id: "marketplace",
        title: "Compra y venta",
        description: "Vende, regala o pide entre vecinos.",
        href: "/marketplace",
        icon: "🛒",
        tint: "bg-[var(--color-surface-glass-strong)]",
      });
    }

    if (isModuleEnabled("reservations") && isFeatureEnabled("resources")) {
      const reserveHint =
        territoryAccess.eligibleResourceCount > 0
          ? `${territoryAccess.eligibleResourceCount} espacios disponibles para ti.`
          : "Pistas, salas y zonas compartidas para reservar.";
      cards.push({
        id: "community-resources",
        title: "Espacios y reservas",
        description: reserveHint,
        href: "/resources",
        icon: "🏘",
        tint: "bg-[var(--color-surface-glass-strong)]",
      });
    }

    return cards;
  }, [
    isFeatureEnabled,
    isModuleEnabled,
    territoryAccess.eligibleResourceCount,
  ]);

  return (
    <MobileScreen>
      <header className="space-y-2 pt-1">
        <h1 className="font-sans text-[28px] font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
          Servicios
        </h1>
        <p className="text-[15px] leading-6 text-[var(--color-text-secondary)]">
          Profesionales y ayuda · espacios para reservar
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="Servicios en silencio"
          description="Cuando tu comunidad active ayuda, trabajo o profesionales, los verás aquí."
          actionLabel="Volver al inicio"
          onAction={() => router.push("/")}
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => router.push(entry.href)}
                className="flex w-full items-start gap-3.5 rounded-[16px] border border-[var(--color-border-glass)] bg-[var(--color-surface-glass)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] backdrop-blur-md transition-transform active:scale-[0.99]"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[22px] ${entry.tint}`}
                  aria-hidden
                >
                  {entry.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold text-[var(--color-text-primary)]">
                    {entry.title}
                  </span>
                  <span className="mt-1 block text-[14px] leading-snug text-[var(--color-text-secondary)]">
                    {entry.description}
                  </span>
                </span>
                <span
                  className="mt-1 shrink-0 text-[var(--color-text-tertiary)]"
                  aria-hidden
                >
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </MobileScreen>
  );
}

function iconForServiceSlug(slug: string): string {
  switch (slug) {
    case "professionals":
      return "👷";
    case "work":
      return "💼";
    case "neighbour-help":
      return "💛";
    case "mobility":
      return "🚗";
    case "recommendations":
      return "⭐";
    default:
      return "•";
  }
}

function tintForServiceSlug(slug: string): string {
  switch (slug) {
    case "professionals":
      return "bg-[var(--color-action-accent-subtle)]";
    case "work":
      return "bg-[var(--color-feedback-warning-subtle)]";
    case "neighbour-help":
      return "bg-[var(--color-accent-lime-subtle)]";
    case "mobility":
      return "bg-[var(--color-sea-subtle)]";
    case "recommendations":
      return "bg-[var(--color-feedback-warning-subtle)]";
    default:
      return "bg-[var(--color-action-primary-subtle)]";
  }
}

function copyForServiceSlug(slug: string, fallback: string): string {
  switch (slug) {
    case "professionals":
      return "Jardinería, mantenimiento, limpieza, reparaciones y clases de confianza.";
    case "work":
      return "Anuncios de trabajo entre vecinos: busco u ofrezco.";
    case "neighbour-help":
      return "Pide u ofrece una mano entre vecinos.";
    case "mobility":
      return "Trayectos compartidos y apoyo para moverte.";
    case "recommendations":
      return "Consejos de vecinos sobre sitios y profesionales.";
    default:
      return fallback;
  }
}
