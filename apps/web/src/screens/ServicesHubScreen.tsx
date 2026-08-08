"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { servicesCategoryHubs } from "@life-community-os/tenant-life-panoramica";
import { MobileScreen } from "@life-community-os/ui";
import { useTenant } from "@/providers/TenantProvider";

type ServiceEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
};

/**
 * Servicios landing — community utility hub (not a marketplace).
 * Cards are projected from existing service / module configuration.
 */
export function ServicesHubScreen() {
  const router = useRouter();
  const { isFeatureEnabled, isModuleEnabled } = useTenant();

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
      });
    }

    if (isModuleEnabled("marketplace") && isFeatureEnabled("marketplace")) {
      cards.push({
        id: "marketplace",
        title: "Compra y venta",
        description: "Vende, regala o pide entre vecinos.",
        href: "/marketplace",
        icon: "🛒",
      });
    }

    if (isModuleEnabled("reservations") && isFeatureEnabled("resources")) {
      cards.push({
        id: "community-services",
        title: "Servicios comunitarios",
        description: "Instalaciones y espacios compartidos de la comunidad.",
        href: "/resources",
        icon: "🏘",
      });
    }

    return cards;
  }, [isFeatureEnabled, isModuleEnabled]);

  return (
    <MobileScreen>
      <header className="pt-1">
        <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-tertiary)]">
          En tu comunidad
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-brand)] text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-text-primary)]">
          Servicios
        </h1>
        <p className="mt-2 max-w-[34ch] text-[16px] leading-snug text-[var(--color-text-secondary)]">
          Soluciones y ayuda cerca de ti
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="mt-10 text-[15px] text-[var(--color-text-secondary)]">
          Los servicios de tu comunidad aparecerán aquí cuando estén activos.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => router.push(entry.href)}
                className="flex w-full items-start gap-3.5 rounded-[16px] bg-[var(--color-surface-elevated)] px-4 py-4 text-left shadow-[var(--shadow-elev-1)] transition-transform active:scale-[0.99]"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-action-primary-subtle)] text-[22px]"
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
      return "🤝";
    case "mobility":
      return "🚗";
    case "recommendations":
      return "⭐";
    default:
      return "•";
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
