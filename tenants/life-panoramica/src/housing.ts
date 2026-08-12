/**
 * Life Panoramica — Housing module activation (tenant pack only).
 *
 * Core Housing stays in `@life-community-os/types`.
 * This file configures enablement knobs + content readiness for this tenant.
 * No listing catalog / demo dwellings here.
 */

import type {
  HousingContentSource,
  HousingTenantModuleConfig,
} from "@life-community-os/types";

/**
 * Tenant-side Housing activation bag.
 * `moduleConfig` is what lands in TenantConfiguration.modules.housing.config.
 * `allowedContentSources` stays pack-local until Core exposes it in schema.
 */
export type LifePanoramicaHousingActivation = {
  /** Mirrors feature flag intent for documentation / pack consumers. */
  enabled: true;
  moduleConfig: HousingTenantModuleConfig;
  /**
   * Content provenance this tenant accepts.
   * `platform_demo` omitted — no demo dwellings in this activation slice.
   */
  allowedContentSources: readonly HousingContentSource[];
};

/**
 * Empty content structure — ready for tenant_managed / publisher creates later.
 * Not a listing catalog.
 */
export type LifePanoramicaHousingContentIndex = {
  /** Reserved for future tenant-managed listing ids (empty for now). */
  tenantManagedListingIds: readonly string[];
  /** Reserved for session/API-backed resident creates (empty for now). */
  residentCreatedListingIds: readonly string[];
  /** Reserved for authorized professional creates (empty for now). */
  professionalCreatedListingIds: readonly string[];
};

/** Initial Housing knobs for Life Panoramica. */
export const lifePanoramicaHousingModuleConfig: HousingTenantModuleConfig = {
  enabledCategories: ["rent", "sale", "land", "commercial"],
  publishing: {
    residentsEnabled: true,
    professionalsEnabled: true,
    moderationRequired: true,
    professionalApprovalRequired: true,
    professionalVerificationRequired: false,
  },
  defaultCurrency: "EUR",
  copy: {
    moduleLabel: "Vivienda",
    rentLabel: "Alquiler",
    saleLabel: "Venta",
    landLabel: "Terreno",
    commercialLabel: "Local",
    contactCtaLabel: "Contactar por este anuncio",
  },
  zones: [
    { key: "aldea-golf", label: "Aldea Golf" },
    { key: "zona-verde", label: "Zona Verde" },
    { key: "centro", label: "Centro" },
  ],
};

export const lifePanoramicaHousingActivation: LifePanoramicaHousingActivation =
  {
    enabled: true,
    moduleConfig: lifePanoramicaHousingModuleConfig,
    allowedContentSources: [
      "tenant_managed",
      "resident_created",
      "professional_created",
    ],
  };

/** Content index scaffold — no listings seeded. */
export const lifePanoramicaHousingContentIndex: LifePanoramicaHousingContentIndex =
  {
    tenantManagedListingIds: [],
    residentCreatedListingIds: [],
    professionalCreatedListingIds: [],
  };

export function isHousingContentSourceAllowedForLifePanoramica(
  source: HousingContentSource,
): boolean {
  return lifePanoramicaHousingActivation.allowedContentSources.includes(source);
}
