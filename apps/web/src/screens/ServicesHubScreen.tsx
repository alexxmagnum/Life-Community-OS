"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { asset, hasAsset } from "@life-community-os/assets";
import {
  getTerritoryAccessContext,
  PROFESSIONALS_HEADER_ART_URL,
  servicesCategoryHubs,
} from "@life-community-os/tenant-life-panoramica";
import {
  AssetPad,
  EmptyState,
  MobileScreen,
  type AssetPadTone,
} from "@life-community-os/ui";
import { CAPABILITIES, useTenant } from "@/providers/TenantProvider";

type ServiceEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Platform registry key for type:card, or null → placeholder. */
  assetKey: string | null;
  assetSrc?: string;
  tone: AssetPadTone;
};

/** Caller-owned tones — AssetPad stays category-agnostic. */
const SERVICE_HUB_TONES: Record<string, AssetPadTone> = {
  professionals: "cyan",
  work: "copper",
  "neighbour-help": "green",
  mobility: "blue",
  recommendations: "purple",
  marketplace: "berry",
  "community-resources": "teal",
};

/**
 * Hub pad media — registry CARD keys, or direct URLs for explicitly requested art.
 */
const SERVICE_HUB_ASSET_KEYS: Record<string, string | null> = {
  professionals: null, // resolved via PROFESSIONALS_HEADER_ART_URL below
  work: "community.jobs.card",
  "neighbour-help": "community.neighbour-help.card",
  mobility: "mobility.car-share.card",
  recommendations: null,
  marketplace: null,
  "community-resources": null,
};

/** Direct (non-registry) pad art when the caller opts in. */
const SERVICE_HUB_ASSET_URLS: Record<string, string> = {
  professionals: PROFESSIONALS_HEADER_ART_URL,
};

function resolveHubAsset(
  entryId: string,
): { assetKey: string | null; assetSrc?: string } {
  const directUrl = SERVICE_HUB_ASSET_URLS[entryId];
  if (directUrl) {
    return { assetKey: entryId, assetSrc: directUrl };
  }
  const key = SERVICE_HUB_ASSET_KEYS[entryId] ?? null;
  if (!key || !hasAsset(key)) {
    return { assetKey: key };
  }
  return { assetKey: key, assetSrc: asset(key) };
}

/**
 * Servicios nav hub — “Necesito resolver algo”.
 * Uniform AssetPad grid: real type:card asset or layout-stable placeholder.
 */
export function ServicesHubScreen() {
  const router = useRouter();
  const {
    isFeatureEnabled,
    isModuleEnabled,
    hasCapability,
    isProductCapabilityEnabled,
    personId,
  } = useTenant();

  const territoryAccess = useMemo(
    () =>
      getTerritoryAccessContext(personId ?? "", {
        canReservePermission: hasCapability(CAPABILITIES.resourceReserve),
      }),
    [personId, hasCapability],
  );

  const entries = useMemo((): ServiceEntry[] => {
    const cards: ServiceEntry[] = [];

    if (!isModuleEnabled("services")) return cards;

    for (const hub of servicesCategoryHubs) {
      const flagsOk = hub.featureKeys.some((key) => isFeatureEnabled(key));
      if (!flagsOk) continue;
      const resolved = resolveHubAsset(hub.slug);
      cards.push({
        id: hub.slug,
        title: hub.label,
        description: copyForServiceSlug(hub.slug, hub.description),
        href: `/services/${hub.slug}`,
        tone: SERVICE_HUB_TONES[hub.slug] ?? "neutral",
        ...resolved,
      });
    }

    if (
      isModuleEnabled("marketplace") &&
      isFeatureEnabled("marketplace") &&
      isProductCapabilityEnabled("marketplace")
    ) {
      cards.push({
        id: "marketplace",
        title: "Compra y venta",
        description: "Vende, regala o pide entre vecinos.",
        href: "/marketplace",
        tone: SERVICE_HUB_TONES.marketplace ?? "neutral",
        ...resolveHubAsset("marketplace"),
      });
    }

    if (isModuleEnabled("reservations") && isFeatureEnabled("resources")) {
      const reserveHint =
        territoryAccess.eligibleResourceCount > 0
          ? `${territoryAccess.eligibleResourceCount} espacios disponibles.`
          : "Pistas, salas y zonas compartidas.";
      cards.push({
        id: "community-resources",
        title: "Espacios y reservas",
        description: reserveHint,
        href: "/resources",
        tone: SERVICE_HUB_TONES["community-resources"] ?? "neutral",
        ...resolveHubAsset("community-resources"),
      });
    }

    return cards;
  }, [
    isFeatureEnabled,
    isModuleEnabled,
    isProductCapabilityEnabled,
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
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 md:max-w-[720px]">
          {entries.map((entry, index) => (
            <li key={entry.id} className="min-w-0">
              <AssetPad
                assetSrc={entry.assetSrc}
                title={entry.title}
                meta={entry.description}
                tone={entry.tone}
                staggerIndex={index}
                onClick={() => router.push(entry.href)}
              />
            </li>
          ))}
        </ul>
      )}
    </MobileScreen>
  );
}

function copyForServiceSlug(slug: string, fallback: string): string {
  switch (slug) {
    case "professionals":
      return "Ayuda cualificada cerca.";
    case "work":
      return "Busco u ofrezco trabajo.";
    case "neighbour-help":
      return "Una mano entre vecinos.";
    case "mobility":
      return "Trayectos y movilidad.";
    case "recommendations":
      return "Consejos de confianza.";
    default:
      return fallback;
  }
}
