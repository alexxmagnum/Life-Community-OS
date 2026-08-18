/**
 * Materialize tenant pack catalogs into durable JSON (first-run seed).
 */

import {
  communityContentCatalog,
  experienceCatalog,
  marketplaceCatalog,
  resourceCatalog,
} from "@life-community-os/tenant-life-panoramica";
import {
  ensureCatalogSeeded,
  type CatalogDomain,
} from "./server-catalog-repository";

const VALLEY_COMMUNITY = [
  {
    id: "lv-cc-welcome",
    type: "official_announcement",
    status: "published",
    title: "Bienvenida a Life Valley",
    body: "Tenant de validación multi-tenant. Este contenido solo existe aquí.",
    areaLabel: "Centro Valle",
    authorName: "Life Valley",
    publishedAt: new Date().toISOString(),
    reactionCounts: {},
    comments: [],
    commentCount: 0,
  },
];

const VALLEY_EXPERIENCES = [
  {
    id: "lv-exp-walk",
    title: "Paseo del valle",
    summary: "Experiencia exclusiva del tenant Life Valley.",
    status: "published",
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    areaLabel: "Centro Valle",
  },
];

const VALLEY_MARKETPLACE = [
  {
    id: "lv-mp-bike",
    kind: "give",
    title: "Bicicleta Valley",
    description: "Anuncio solo visible en Life Valley.",
    areaLabel: "Centro Valle",
    status: "published",
  },
];

const VALLEY_RESOURCES = [
  {
    id: "lv-res-room",
    name: "Sala Valley",
    description: "Recurso territorial del segundo tenant.",
    areaLabel: "Centro Valle",
    kind: "room",
  },
];

function seedFor(
  tenantSlug: string,
  domain: CatalogDomain,
): unknown[] {
  if (tenantSlug === "life-valley") {
    switch (domain) {
      case "community":
        return VALLEY_COMMUNITY;
      case "experiences":
        return VALLEY_EXPERIENCES;
      case "marketplace":
        return VALLEY_MARKETPLACE;
      case "resources":
        return VALLEY_RESOURCES;
    }
  }

  switch (domain) {
    case "community":
      return [...communityContentCatalog];
    case "experiences":
      return [...experienceCatalog];
    case "marketplace":
      return [...marketplaceCatalog];
    case "resources":
      return [...resourceCatalog];
  }
}

export async function bootstrapTenantCatalog(
  tenantSlug: string,
  domain: CatalogDomain,
): Promise<unknown[]> {
  return ensureCatalogSeeded(tenantSlug, domain, seedFor(tenantSlug, domain));
}

export async function bootstrapAllCatalogs(
  tenantSlug: string,
): Promise<Record<CatalogDomain, unknown[]>> {
  const domains: CatalogDomain[] = [
    "community",
    "experiences",
    "marketplace",
    "resources",
  ];
  const out = {} as Record<CatalogDomain, unknown[]>;
  for (const domain of domains) {
    out[domain] = await bootstrapTenantCatalog(tenantSlug, domain);
  }
  return out;
}
