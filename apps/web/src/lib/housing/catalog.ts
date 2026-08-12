/**
 * Demo Housing catalog + session persistence (platform surface foundation).
 * Tenant-neutral seed content — not a Life Panoramica product catalog.
 */

import type {
  HousingContactIntent,
  HousingContentSource,
  HousingListing,
  HousingListingStatus,
  HousingListingType,
  HousingPublisherKind,
  HousingTenantModuleConfig,
  TenantConfiguration,
} from "@life-community-os/types";
import {
  buildHousingPublisher,
  housingContentSourceForPublisherKind,
  HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
  resolveHousingTenantModuleConfig,
} from "@life-community-os/types";

const CREATED_STORAGE_KEY = "lcos.housing.created.v1";
const OVERRIDES_STORAGE_KEY = "lcos.housing.overrides.v1";
const CONTACT_STORAGE_KEY = "lcos.housing.contact-intents.v1";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80";

const DEMO_TENANT = "demo-tenant";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function platformDemoPublisher(personId: string) {
  return buildHousingPublisher({ kind: "resident", personId });
}

/** Neutral seed listings for local demo — swap per tenant later. */
export const housingSeedCatalog: HousingListing[] = [
  {
    id: "hs-rent-loft",
    tenantId: DEMO_TENANT,
    type: "rent",
    status: "published",
    publisherKind: "resident",
    contentSource: "platform_demo",
    publisher: platformDemoPublisher("person-elena"),
    title: "Loft luminoso con terraza",
    description:
      "Dos dormitorios, cocina abierta y terraza soleada. Ideal para teletrabajo. Entrada flexible.",
    priceAmount: 1100,
    currency: "EUR",
    pricePeriodLabel: "mes",
    ownership: {
      ownerKind: "person",
      ownerPersonId: "person-elena",
    },
    publication: {
      visibility: "territory",
      publishedAt: daysAgo(2),
      publishedByPersonId: "person-elena",
    },
    property: {
      id: "hp-loft",
      zoneKey: "north",
      areaLabel: "Zona norte",
      addressLabel: "Calle Alta 12",
      bedrooms: 2,
      bathrooms: 1,
      builtAreaM2: 78,
      amenities: ["Terraza", "Fibra", "Ascensor"],
    },
    media: [
      {
        id: "hm-loft-1",
        listingId: "hs-rent-loft",
        kind: "image",
        url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
      {
        id: "hm-loft-2",
        listingId: "hs-rent-loft",
        kind: "image",
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
        sortOrder: 1,
      },
    ],
    contactPersonId: "person-elena",
    createdByPersonId: "person-elena",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: "hs-sale-villa",
    tenantId: DEMO_TENANT,
    type: "sale",
    status: "published",
    publisherKind: "resident",
    contentSource: "platform_demo",
    publisher: platformDemoPublisher("person-jordi"),
    title: "Casa con jardín",
    description:
      "Tres dormitorios, jardín privado y plaza de parking. Buena orientación.",
    priceAmount: 320000,
    currency: "EUR",
    ownership: {
      ownerKind: "person",
      ownerPersonId: "person-jordi",
    },
    publication: {
      visibility: "territory",
      publishedAt: daysAgo(5),
      publishedByPersonId: "person-jordi",
    },
    property: {
      id: "hp-villa",
      zoneKey: "center",
      areaLabel: "Centro",
      bedrooms: 3,
      bathrooms: 2,
      builtAreaM2: 140,
      landAreaM2: 220,
      amenities: ["Jardín", "Parking", "Trastero"],
    },
    media: [
      {
        id: "hm-villa-1",
        listingId: "hs-sale-villa",
        kind: "image",
        url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
    ],
    contactPersonId: "person-jordi",
    createdByPersonId: "person-jordi",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
  },
  {
    id: "hs-land-plot",
    tenantId: DEMO_TENANT,
    type: "land",
    status: "published",
    publisherKind: "resident",
    contentSource: "platform_demo",
    publisher: platformDemoPublisher("person-luis"),
    title: "Parcela edificable",
    description:
      "Parcela residencial con acceso rodado y servicios en límite. Consultar normativa.",
    priceAmount: 95000,
    currency: "EUR",
    ownership: {
      ownerKind: "person",
      ownerPersonId: "person-luis",
    },
    publication: {
      visibility: "territory",
      publishedAt: daysAgo(8),
      publishedByPersonId: "person-luis",
    },
    property: {
      id: "hp-land",
      zoneKey: "coast",
      areaLabel: "Costa",
      landAreaM2: 450,
      amenities: ["Acceso rodado"],
    },
    media: [
      {
        id: "hm-land-1",
        listingId: "hs-land-plot",
        kind: "image",
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
    ],
    contactPersonId: "person-luis",
    createdByPersonId: "person-luis",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(8),
  },
  {
    id: "hs-commercial-local",
    tenantId: DEMO_TENANT,
    type: "commercial",
    status: "published",
    publisherKind: "resident",
    contentSource: "platform_demo",
    publisher: platformDemoPublisher("person-ana"),
    title: "Local en planta calle",
    description:
      "Local comercial con escaparate. Apto para oficina o retail ligero.",
    priceAmount: 1450,
    currency: "EUR",
    pricePeriodLabel: "mes",
    ownership: {
      ownerKind: "person",
      ownerPersonId: "person-ana",
    },
    publication: {
      visibility: "territory",
      publishedAt: daysAgo(1),
      publishedByPersonId: "person-ana",
    },
    property: {
      id: "hp-local",
      zoneKey: "center",
      areaLabel: "Centro",
      builtAreaM2: 65,
      floor: 0,
      amenities: ["Escaparate", "Aseo", "Almacén"],
    },
    media: [
      {
        id: "hm-local-1",
        listingId: "hs-commercial-local",
        kind: "image",
        url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
        sortOrder: 0,
      },
    ],
    contactPersonId: "person-ana",
    createdByPersonId: "person-ana",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    id: "hs-rent-marta-draft",
    tenantId: DEMO_TENANT,
    type: "rent",
    status: "draft",
    publisherKind: "resident",
    contentSource: "platform_demo",
    publisher: platformDemoPublisher("person-marta"),
    title: "Estudio en borrador",
    description:
      "Borrador de ejemplo para probar publicación y ciclo de vida desde Mis anuncios.",
    priceAmount: 750,
    currency: "EUR",
    pricePeriodLabel: "mes",
    ownership: {
      ownerKind: "person",
      ownerPersonId: "person-marta",
    },
    publication: {
      visibility: "territory",
    },
    property: {
      id: "hp-marta-studio",
      zoneKey: "north",
      areaLabel: "Zona norte",
      bedrooms: 1,
      bathrooms: 1,
      builtAreaM2: 42,
    },
    media: [
      {
        id: "hm-marta-1",
        listingId: "hs-rent-marta-draft",
        kind: "image",
        url: DEFAULT_IMAGE,
        sortOrder: 0,
      },
    ],
    contactPersonId: "person-marta",
    createdByPersonId: "person-marta",
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
];

/**
 * Resolve Housing knobs from TenantConfiguration (runtime).
 * Falls back to platform defaults when configuration is omitted.
 */
export function getHousingModuleConfig(
  configuration?: TenantConfiguration,
): HousingTenantModuleConfig {
  if (configuration) {
    return resolveHousingTenantModuleConfig(configuration);
  }
  return {
    ...HOUSING_TENANT_MODULE_CONFIG_DEFAULTS,
    publishing: { ...HOUSING_TENANT_MODULE_CONFIG_DEFAULTS.publishing },
  };
}

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readCreated(): HousingListing[] {
  return readJson<HousingListing>(CREATED_STORAGE_KEY);
}

function writeCreated(items: HousingListing[]) {
  writeJson(CREATED_STORAGE_KEY, items);
}

function readOverrides(): Record<string, Partial<HousingListing>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<HousingListing>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(map: Record<string, Partial<HousingListing>>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(map));
}

function applyOverride(listing: HousingListing): HousingListing {
  const patch = readOverrides()[listing.id];
  if (!patch) return listing;
  return {
    ...listing,
    ...patch,
    ownership: patch.ownership ?? listing.ownership,
    publication: patch.publication
      ? { ...listing.publication, ...patch.publication }
      : listing.publication,
    property: patch.property
      ? { ...listing.property, ...patch.property }
      : listing.property,
    media: patch.media ?? listing.media,
  };
}

export function listHousingListings(options?: {
  includeSessionCreated?: boolean;
}): HousingListing[] {
  const includeSession =
    options?.includeSessionCreated ?? typeof window !== "undefined";
  const created = includeSession ? readCreated() : [];
  const seen = new Set<string>();
  const merged: HousingListing[] = [];
  for (const item of [...created, ...housingSeedCatalog]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(applyOverride(item));
  }
  return merged.sort((a, b) => {
    const aAt = a.updatedAt ?? a.createdAt ?? "";
    const bAt = b.updatedAt ?? b.createdAt ?? "";
    return new Date(bAt).getTime() - new Date(aAt).getTime();
  });
}

export function listPublishedHousingListings(options?: {
  includeSessionCreated?: boolean;
  type?: HousingListingType | "all";
  zoneKey?: string | "all";
}): HousingListing[] {
  const type = options?.type ?? "all";
  const zoneKey = options?.zoneKey ?? "all";
  return listHousingListings(options).filter((listing) => {
    if (listing.status !== "published") return false;
    if (listing.publication.visibility === "unlisted") return false;
    if (type !== "all" && listing.type !== type) return false;
    if (zoneKey !== "all" && listing.property.zoneKey !== zoneKey) return false;
    return true;
  });
}

export function listHousingListingsByOwner(
  personId: string,
  options?: { includeSessionCreated?: boolean },
): HousingListing[] {
  const pid = personId.trim();
  if (!pid) return [];
  return listHousingListings(options).filter((listing) => {
    if (listing.createdByPersonId === pid) return true;
    return (
      listing.ownership.ownerKind === "person" &&
      listing.ownership.ownerPersonId === pid
    );
  });
}

export function getHousingListingById(
  listingId: string,
  options?: { includeSessionCreated?: boolean },
): HousingListing | undefined {
  const target = listingId.trim();
  if (!target) return undefined;
  return listHousingListings(options).find((item) => item.id === target);
}

export type CreateHousingListingInput = {
  type: HousingListingType;
  title: string;
  description: string;
  priceAmount?: number;
  currency?: string;
  pricePeriodLabel?: string;
  areaLabel?: string;
  zoneKey?: string;
  bedrooms?: number;
  bathrooms?: number;
  builtAreaM2?: number;
  createdByPersonId: string;
  publisherKind: HousingPublisherKind;
  /**
   * Override provenance (e.g. tenant_managed).
   * Defaults from publisherKind when omitted.
   */
  contentSource?: HousingContentSource;
  /** Optional public labels for professional publishers. */
  publisherDisplayName?: string;
  organizationName?: string;
  organizationId?: string;
  publisherProfileId?: string;
  /** Initial status after create — caller must respect lifecycle. */
  status: Extract<HousingListingStatus, "draft" | "pending_review" | "published">;
  imageUrl?: string;
};

export function createHousingListing(
  input: CreateHousingListingInput,
): HousingListing {
  const id = `hs-created-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const imageUrl = input.imageUrl?.trim() || DEFAULT_IMAGE;
  const isProfessional = input.publisherKind === "professional";
  const contentSource =
    input.contentSource ??
    housingContentSourceForPublisherKind(input.publisherKind);
  const publisher = buildHousingPublisher({
    kind: input.publisherKind,
    personId: input.createdByPersonId,
    displayName: input.publisherDisplayName,
    organizationName: input.organizationName,
    organizationId: input.organizationId,
    publisherProfileId: input.publisherProfileId,
  });
  const listing: HousingListing = {
    id,
    tenantId: DEMO_TENANT,
    type: input.type,
    status: input.status,
    publisherKind: input.publisherKind,
    contentSource,
    publisher,
    title: input.title.trim(),
    description: input.description.trim(),
    priceAmount: input.priceAmount,
    currency: input.currency ?? "EUR",
    pricePeriodLabel: input.pricePeriodLabel,
    ownership: {
      ownerKind: isProfessional ? "business_profile" : "person",
      ownerPersonId: input.createdByPersonId,
      ownerEntityId: input.organizationId,
    },
    publication: {
      visibility: "territory",
      publishedAt: input.status === "published" ? now : undefined,
      publishedByPersonId:
        input.status === "published" ? input.createdByPersonId : undefined,
      requiresReview: input.status === "pending_review",
    },
    property: {
      id: `hp-${id}`,
      zoneKey: input.zoneKey,
      areaLabel: input.areaLabel,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      builtAreaM2: input.builtAreaM2,
    },
    media: [
      {
        id: `hm-${id}-0`,
        listingId: id,
        kind: "image",
        url: imageUrl,
        sortOrder: 0,
      },
    ],
    contactPersonId: input.createdByPersonId,
    createdByPersonId: input.createdByPersonId,
    createdAt: now,
    updatedAt: now,
  };
  const existing = readCreated();
  writeCreated([listing, ...existing.filter((i) => i.id !== id)]);
  return listing;
}

export function updateHousingListingStatus(
  listingId: string,
  status: HousingListingStatus,
  actorPersonId?: string,
): HousingListing | undefined {
  const current = getHousingListingById(listingId);
  if (!current) return undefined;
  const now = new Date().toISOString();
  const next: HousingListing = {
    ...current,
    status,
    updatedAt: now,
    publication: {
      ...current.publication,
      publishedAt:
        status === "published"
          ? current.publication.publishedAt ?? now
          : current.publication.publishedAt,
      publishedByPersonId:
        status === "published"
          ? current.publication.publishedByPersonId ?? actorPersonId
          : current.publication.publishedByPersonId,
      requiresReview: status === "pending_review",
    },
  };

  const created = readCreated();
  const createdIdx = created.findIndex((i) => i.id === listingId);
  if (createdIdx >= 0) {
    const nextCreated = [...created];
    nextCreated[createdIdx] = next;
    writeCreated(nextCreated);
    return next;
  }

  const overrides = readOverrides();
  overrides[listingId] = {
    status: next.status,
    updatedAt: next.updatedAt,
    publication: next.publication,
  };
  writeOverrides(overrides);
  return next;
}

export function submitHousingContactIntent(input: {
  listingId: string;
  fromPersonId: string;
  message?: string;
}): HousingContactIntent {
  const intent: HousingContactIntent = {
    id: `hci-${Date.now().toString(36)}`,
    tenantId: DEMO_TENANT,
    listingId: input.listingId,
    fromPersonId: input.fromPersonId,
    status: "submitted",
    message: input.message?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const existing = readJson<HousingContactIntent>(CONTACT_STORAGE_KEY);
  writeJson(CONTACT_STORAGE_KEY, [intent, ...existing]);
  return intent;
}

export function listHousingContactIntentsForPerson(
  personId: string,
): HousingContactIntent[] {
  return readJson<HousingContactIntent>(CONTACT_STORAGE_KEY).filter(
    (i) => i.fromPersonId === personId,
  );
}
