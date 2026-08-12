/**
 * Platform Module Registry (Phase D.0.1).
 *
 * Tenant-neutral catalogue of Community OS modules (ADR-014 / ADR-023).
 * Availability is controlled by Tenant Configuration + feature flags later.
 * This registry does not grant Permissions (ADR-012) and needs no database yet.
 *
 * OFF = hidden but still supported by architecture — never delete a module row.
 */

/** Registry document version — bump when module contracts change. */
export const PLATFORM_MODULE_REGISTRY_VERSION = "1.0.0" as const;

export type PlatformModuleCategory =
  | "core"
  | "official"
  | "lifestyle"
  | "commerce";

/** Product maturity of the module definition (not tenant enablement). */
export type PlatformModuleStatus = "core" | "optional" | "experimental";

/**
 * Optional navigation binding for the future nav projector (D.0.3).
 * Presence here does not imply the item is shown — enablement + caps decide.
 */
export type PlatformModuleNavigation = {
  /** Logical menu group key, e.g. "official", "activities", "services". */
  menuGroup: string;
  label: string;
  href?: string;
  order?: number;
  /** Icon key consumed by AppMenuLeafIcon / explorer hubs. */
  icon?: string;
};

/**
 * Canonical platform module definition.
 * Future modules (Boat Club, School, …) are additive registry entries.
 */
export type PlatformModule = {
  id: string;
  name: string;
  description: string;
  category: PlatformModuleCategory;
  status: PlatformModuleStatus;
  /** Default when a tenant has no explicit override. */
  defaultEnabled: boolean;
  /** Other module ids that should be enabled first. */
  dependencies: readonly string[];
  /**
   * Existing TenantFeatureFlags keys (or future Core flag keys).
   * Empty when enablement is structural / always-on with parent.
   */
  featureFlagKeys: readonly string[];
  /**
   * Related capability strings (ADR-012) — documentation / mapping only.
   * Never grants AuthZ by itself.
   */
  capabilityKeys: readonly string[];
  navigation?: PlatformModuleNavigation;
  submodules?: readonly PlatformModule[];
  /** Placeholder for future JSON Schema / tenant config shape. */
  configurationSchema?: Record<string, unknown>;
};

export type PlatformModuleRegistryIssue = {
  code:
    | "duplicate_id"
    | "missing_dependency"
    | "self_dependency"
    | "empty_id"
    | "empty_name";
  moduleId: string;
  message: string;
  dependencyId?: string;
};

/** Capability string constants used by registry mapping (tenant-neutral). */
const CAP = {
  contentView: "community.content.view",
  contentCreate: "community.content.create",
  channelView: "community.channel.view",
  channelCreate: "community.channel.create",
  channelPublish: "community.channel.publish",
  groupCreate: "community.group.create",
  proposalCreate: "community.proposal.create",
  experienceView: "community.experience.view",
  experienceCreate: "community.experience.create",
  experienceJoin: "community.experience.join",
  experienceManage: "community.experience.manage",
  resourceView: "community.resource.view",
  resourceReserve: "community.resource.reserve",
  resourceManage: "community.resource.manage",
  localView: "community.local.view",
  marketplaceView: "community.marketplace.view",
  marketplaceCreate: "community.marketplace.create",
  recommendationCreate: "community.recommendation.create",
  residencyClaim: "community.residency.claim",
  residencyVerifyReview: "community.residency.verify_review",
  manageEnter: "community.manage.enter",
  announcementPublishOfficial: "community.announcement.publish_official",
  securityView: "community.security.view",
  securityNoticesView: "community.security.notices.view",
  securityGateView: "community.security.gate.view",
  securityPatrolView: "community.security.patrol.view",
  securityIncidentCreate: "community.security.incident.create",
  pulseView: "community.pulse.view",
  /** Housing / Living — platform module (fail closed until tenant enables). */
  housingView: "housing.view",
  /** Resident owner — publish own property. */
  housingCreateOwnListing: "housing.create_own_listing",
  /** Resident owner — edit own listing. */
  housingEditOwnListing: "housing.edit_own_listing",
  /** Authorized agency / promoter publisher. */
  housingPublisher: "housing.publisher",
  housingContact: "housing.contact",
  housingSave: "housing.save",
  housingManage: "housing.manage",
  /**
   * Life Map — spatial digital twin surface (premium, fail closed).
   * Transversal projection layer — not owned by Community/Housing/Services.
   */
  lifeMapView: "lifeMap.view",
  lifeMapInteract: "lifeMap.interact",
  lifeMapManage: "lifeMap.manage",
} as const;

function mod(module: PlatformModule): PlatformModule {
  return module;
}

/**
 * Root platform modules for the current Community OS ecosystem.
 * Nested lifestyle / official rows remain first-class via flattening helpers.
 */
export const PLATFORM_MODULE_REGISTRY: readonly PlatformModule[] = [
  mod({
    id: "community",
    name: "Community",
    description:
      "Resident communication and participation — channels, groups, proposals.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: [
      "communityChannels",
      "groups",
      "decide",
      "feed",
      "interactions",
    ],
    capabilityKeys: [
      CAP.contentView,
      CAP.contentCreate,
      CAP.channelView,
      CAP.channelCreate,
      CAP.channelPublish,
      CAP.groupCreate,
      CAP.proposalCreate,
    ],
    navigation: {
      menuGroup: "community",
      label: "Comunidad",
      href: "/community",
      order: 10,
      icon: "people",
    },
    configurationSchema: {},
    submodules: [
      mod({
        id: "community.channels",
        name: "Channels",
        description: "Community, private and official channels.",
        category: "core",
        status: "core",
        defaultEnabled: true,
        dependencies: ["community"],
        featureFlagKeys: ["communityChannels", "officialChannels"],
        capabilityKeys: [CAP.channelView, CAP.channelCreate, CAP.channelPublish],
        navigation: {
          menuGroup: "community",
          label: "Canales",
          href: "/community?tab=canales",
          order: 14,
          icon: "public",
        },
        configurationSchema: {},
      }),
      mod({
        id: "community.groups",
        name: "Groups",
        description: "Resident and interest groups.",
        category: "core",
        status: "core",
        defaultEnabled: true,
        dependencies: ["community"],
        featureFlagKeys: ["groups"],
        capabilityKeys: [CAP.groupCreate],
        navigation: {
          menuGroup: "community",
          label: "Grupos",
          href: "/community?tab=grupos",
          order: 11,
          icon: "people",
        },
        configurationSchema: {},
      }),
      mod({
        id: "community.proposals",
        name: "Proposals",
        description: "Ideas, voting and community initiatives.",
        category: "core",
        status: "core",
        defaultEnabled: true,
        dependencies: ["community"],
        featureFlagKeys: ["decide"],
        capabilityKeys: [CAP.proposalCreate],
        navigation: {
          menuGroup: "community",
          label: "Propuestas",
          href: "/community?tab=propuestas",
          order: 12,
          icon: "proposal",
        },
        configurationSchema: {},
      }),
      mod({
        id: "community.pets",
        name: "Pets",
        description: "Pet community, lost pets and related communication.",
        category: "core",
        status: "optional",
        defaultEnabled: true,
        dependencies: ["community"],
        featureFlagKeys: [],
        capabilityKeys: [CAP.contentView, CAP.contentCreate],
        navigation: {
          menuGroup: "community",
          label: "Mascotas",
          href: "/community?tab=mascotas",
          order: 18,
          icon: "family",
        },
        configurationSchema: {},
      }),
    ],
  }),

  mod({
    id: "activities",
    name: "Activities",
    description:
      "Permanent community interests — sports, nature, wellness, learning.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: ["activities"],
    capabilityKeys: [CAP.experienceView, CAP.channelView],
    navigation: {
      menuGroup: "activities",
      label: "Actividades",
      order: 20,
      icon: "sport",
    },
    configurationSchema: {},
    submodules: [
      mod({
        id: "sports",
        name: "Sports",
        description: "Sports activity family — tenant configures which sports.",
        category: "lifestyle",
        status: "core",
        defaultEnabled: true,
        dependencies: ["activities"],
        featureFlagKeys: ["activities"],
        capabilityKeys: [],
        navigation: {
          menuGroup: "activities",
          label: "Deportes",
          order: 21,
          icon: "sport",
        },
        configurationSchema: {},
        submodules: [
          mod({
            id: "golf",
            name: "Golf",
            description: "Golf activity hub.",
            category: "lifestyle",
            status: "optional",
            defaultEnabled: true,
            dependencies: ["activities", "sports"],
            featureFlagKeys: ["activities"],
            capabilityKeys: [],
            navigation: {
              menuGroup: "activities",
              label: "Golf",
              href: "/activities/golf",
              order: 22,
              icon: "golf",
            },
            configurationSchema: {},
          }),
          mod({
            id: "padel",
            name: "Pádel",
            description: "Padel activity hub.",
            category: "lifestyle",
            status: "optional",
            defaultEnabled: true,
            dependencies: ["activities", "sports"],
            featureFlagKeys: ["activities"],
            capabilityKeys: [],
            navigation: {
              menuGroup: "activities",
              label: "Pádel",
              href: "/activities/padel",
              order: 23,
              icon: "padel",
            },
            configurationSchema: {},
          }),
          mod({
            id: "tennis",
            name: "Tennis",
            description: "Tennis activity hub.",
            category: "lifestyle",
            status: "optional",
            defaultEnabled: true,
            dependencies: ["activities", "sports"],
            featureFlagKeys: ["activities"],
            capabilityKeys: [],
            navigation: {
              menuGroup: "activities",
              label: "Tenis",
              href: "/activities/tennis",
              order: 24,
              icon: "tennis",
            },
            configurationSchema: {},
          }),
        ],
      }),
      mod({
        id: "nature",
        name: "Nature",
        description: "Hiking, walking and outdoor nature activities.",
        category: "lifestyle",
        status: "optional",
        defaultEnabled: true,
        dependencies: ["activities"],
        featureFlagKeys: ["activities"],
        capabilityKeys: [],
        navigation: {
          menuGroup: "activities",
          label: "Naturaleza",
          href: "/activities/nature",
          order: 25,
          icon: "hike",
        },
        configurationSchema: {},
      }),
      mod({
        id: "wellness",
        name: "Wellness",
        description: "Health and relaxation activities.",
        category: "lifestyle",
        status: "optional",
        defaultEnabled: true,
        dependencies: ["activities"],
        featureFlagKeys: ["activities"],
        capabilityKeys: [],
        navigation: {
          menuGroup: "activities",
          label: "Bienestar",
          href: "/activities/wellness",
          order: 26,
          icon: "class",
        },
        configurationSchema: {},
      }),
      mod({
        id: "workshops",
        name: "Learning",
        description: "Classes and workshops.",
        category: "lifestyle",
        status: "optional",
        defaultEnabled: true,
        dependencies: ["activities"],
        featureFlagKeys: ["activities"],
        capabilityKeys: [],
        navigation: {
          menuGroup: "activities",
          label: "Talleres",
          href: "/activities/workshops",
          order: 27,
          icon: "class",
        },
        configurationSchema: {},
      }),
      mod({
        id: "social",
        name: "Social",
        description: "Leisure and neighbour social activities.",
        category: "lifestyle",
        status: "optional",
        defaultEnabled: true,
        dependencies: ["activities"],
        featureFlagKeys: ["activities"],
        capabilityKeys: [],
        navigation: {
          menuGroup: "activities",
          label: "Ocio social",
          href: "/activities/social",
          order: 28,
          icon: "games",
        },
        configurationSchema: {},
      }),
    ],
  }),

  mod({
    id: "experiences",
    name: "Experiences",
    description:
      "Temporary community-created moments — create, discover, join, calendar.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: ["experiences", "calendar"],
    capabilityKeys: [
      CAP.experienceView,
      CAP.experienceCreate,
      CAP.experienceJoin,
      CAP.experienceManage,
    ],
    navigation: {
      menuGroup: "experiences",
      label: "Experiencias",
      href: "/discover",
      order: 30,
      icon: "calendar",
    },
    configurationSchema: {},
  }),

  mod({
    id: "reservations",
    name: "Reservations",
    description:
      "Resource availability — sports facilities, shared spaces, calendar.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: ["resources", "calendar"],
    capabilityKeys: [
      CAP.resourceView,
      CAP.resourceReserve,
      CAP.resourceManage,
    ],
    navigation: {
      menuGroup: "reservations",
      label: "Reservas",
      href: "/resources",
      order: 40,
      icon: "calendar",
    },
    configurationSchema: {},
  }),

  mod({
    id: "services",
    name: "Services",
    description:
      "Resident needs — professionals, neighbour help, community jobs, mobility, recommendations.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: [
      "services",
      "work",
      "recommendations",
      "mobility",
    ],
    capabilityKeys: [CAP.localView, CAP.recommendationCreate],
    navigation: {
      menuGroup: "services",
      label: "Servicios",
      order: 50,
      icon: "service",
    },
    configurationSchema: {},
  }),

  mod({
    id: "nearby",
    name: "Nearby",
    description:
      "Discover territory — restaurants, businesses, local services, places.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: ["localLife", "localEntities"],
    capabilityKeys: [CAP.localView],
    navigation: {
      menuGroup: "nearby",
      label: "Cerca de ti",
      order: 60,
      icon: "place",
    },
    configurationSchema: {},
  }),

  mod({
    id: "identity",
    name: "Identity & Profile",
    description:
      "Identity, residency, interests, activity, contribution recognition, settings.",
    category: "core",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: ["residencyVerification", "participationTrust"],
    capabilityKeys: [
      CAP.residencyClaim,
      CAP.residencyVerifyReview,
      CAP.manageEnter,
    ],
    navigation: {
      menuGroup: "identity",
      label: "Perfil",
      href: "/me",
      order: 90,
      icon: "people",
    },
    configurationSchema: {},
  }),

  mod({
    id: "official",
    name: "Official",
    description: "Responsible entities — administration and public institutions.",
    category: "official",
    status: "core",
    defaultEnabled: true,
    dependencies: [],
    featureFlagKeys: ["officialChannels"],
    capabilityKeys: [CAP.announcementPublishOfficial, CAP.channelView],
    navigation: {
      menuGroup: "official",
      label: "Oficial",
      order: 70,
      icon: "admin",
    },
    configurationSchema: {},
    submodules: [
      mod({
        id: "administration",
        name: "Administration",
        description: "Territory administration / community management voice.",
        category: "official",
        status: "core",
        defaultEnabled: true,
        dependencies: ["official"],
        featureFlagKeys: ["officialChannels"],
        capabilityKeys: [CAP.announcementPublishOfficial],
        navigation: {
          menuGroup: "official",
          label: "Administración",
          href: "/official/administracion",
          order: 71,
          icon: "admin",
        },
        configurationSchema: {},
      }),
      mod({
        id: "municipality",
        name: "Municipality",
        description: "Municipal / ayuntamiento surface.",
        category: "official",
        status: "optional",
        /** Platform default ON for foundation showcase; tenants may disable. */
        defaultEnabled: true,
        dependencies: ["official"],
        featureFlagKeys: ["municipalServices"],
        capabilityKeys: [CAP.channelView],
        navigation: {
          menuGroup: "official",
          label: "Ayuntamiento",
          href: "/official/municipality",
          order: 72,
          icon: "city",
        },
        configurationSchema: {},
      }),
      mod({
        id: "security",
        name: "Security",
        description:
          "Official security — gate, contacts, patrol, notices, incidents.",
        category: "official",
        status: "optional",
        /** Platform default ON for foundation showcase; tenants may disable. */
        defaultEnabled: true,
        dependencies: ["official"],
        featureFlagKeys: ["securityModule"],
        capabilityKeys: [
          CAP.securityView,
          CAP.securityNoticesView,
          CAP.securityGateView,
          CAP.securityPatrolView,
          CAP.securityIncidentCreate,
        ],
        navigation: {
          menuGroup: "official",
          label: "Seguridad",
          href: "/official/seguridad",
          order: 73,
          icon: "security",
        },
        configurationSchema: {},
      }),
      mod({
        id: "publicServices",
        name: "Public services",
        description:
          "Emergency information, useful public contacts, health information.",
        category: "official",
        status: "optional",
        /** Platform default ON for foundation showcase; tenants may disable. */
        defaultEnabled: true,
        dependencies: ["official"],
        featureFlagKeys: ["municipalServices"],
        capabilityKeys: [CAP.channelView],
        navigation: {
          menuGroup: "official",
          label: "Servicios públicos",
          href: "/official/servicios-publicos",
          order: 74,
          icon: "public",
        },
        configurationSchema: {},
      }),
    ],
  }),

  mod({
    id: "marketplace",
    name: "Marketplace",
    description: "Neighbour-to-neighbour exchange (community life layer).",
    category: "commerce",
    status: "core",
    defaultEnabled: true,
    dependencies: ["services"],
    featureFlagKeys: ["marketplace"],
    capabilityKeys: [CAP.marketplaceView, CAP.marketplaceCreate],
    navigation: {
      menuGroup: "commerce",
      label: "Mercado",
      href: "/marketplace",
      order: 55,
      icon: "cart",
    },
    configurationSchema: {},
  }),

  /**
   * Housing / Living — optional SaaS capability (rent, sale, land, commercial).
   * Distinct from marketplace goods and community resource reservations.
   * defaultEnabled false → fail closed until a tenant turns the feature on.
   * No navigation projector wiring in this foundation slice.
   */
  mod({
    id: "housing",
    name: "Housing",
    description:
      "Housing / Living listings — rent, sale, land, and commercial premises.",
    category: "commerce",
    status: "optional",
    defaultEnabled: false,
    dependencies: [],
    featureFlagKeys: ["housing"],
    capabilityKeys: [
      CAP.housingView,
      CAP.housingCreateOwnListing,
      CAP.housingEditOwnListing,
      CAP.housingPublisher,
      CAP.housingContact,
      CAP.housingSave,
      CAP.housingManage,
    ],
    configurationSchema: {
      enabledCategories: ["rent", "sale", "land", "commercial"],
      publishing: {
        residentsEnabled: true,
        professionalsEnabled: true,
        moderationRequired: false,
        professionalApprovalRequired: false,
        professionalVerificationRequired: false,
      },
      defaultCurrency: "EUR",
      copy: {},
      zones: [],
    },
  }),

  /**
   * Life Map — optional premium spatial twin of the Territory.
   * Projects existing modules into space; never owns business data.
   * defaultEnabled false → fail closed until a tenant turns the feature on.
   * No navigation / UI / map SDK in this foundation slice.
   */
  mod({
    id: "lifeMap",
    name: "Life Map",
    description:
      "Spatial digital twin of the territory — live layers for places, experiences, services, housing, and community.",
    category: "lifestyle",
    status: "optional",
    defaultEnabled: false,
    dependencies: [],
    featureFlagKeys: ["lifeMap"],
    capabilityKeys: [
      CAP.lifeMapView,
      CAP.lifeMapInteract,
      CAP.lifeMapManage,
    ],
    configurationSchema: {},
  }),
];

function walkModules(
  modules: readonly PlatformModule[],
  visit: (module: PlatformModule, parentId: string | null) => void,
  parentId: string | null = null,
): void {
  for (const module of modules) {
    visit(module, parentId);
    if (module.submodules?.length) {
      walkModules(module.submodules, visit, module.id);
    }
  }
}

/** Flatten registry tree into a stable list (depth-first). */
export function listPlatformModules(
  roots: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): PlatformModule[] {
  const out: PlatformModule[] = [];
  walkModules(roots, (module) => {
    out.push(module);
  });
  return out;
}

/** Root modules only (no nested rows). */
export function listRootPlatformModules(
  roots: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): readonly PlatformModule[] {
  return roots;
}

/** Lookup by id across roots and submodules. */
export function getPlatformModuleById(
  id: string,
  roots: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): PlatformModule | undefined {
  return listPlatformModules(roots).find((m) => m.id === id);
}

/** Modules that declare a given feature flag key. */
export function listPlatformModulesByFeatureFlag(
  featureFlagKey: string,
  roots: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): PlatformModule[] {
  return listPlatformModules(roots).filter((m) =>
    m.featureFlagKeys.includes(featureFlagKey),
  );
}

/**
 * Structural validation of the registry (unique ids, dependencies resolve).
 * Does not evaluate tenant enablement.
 */
export function validatePlatformModuleRegistry(
  roots: readonly PlatformModule[] = PLATFORM_MODULE_REGISTRY,
): PlatformModuleRegistryIssue[] {
  const issues: PlatformModuleRegistryIssue[] = [];
  const byId = new Map<string, PlatformModule>();

  walkModules(roots, (module) => {
    if (!module.id.trim()) {
      issues.push({
        code: "empty_id",
        moduleId: module.id,
        message: "module id must be non-empty",
      });
      return;
    }
    if (!module.name.trim()) {
      issues.push({
        code: "empty_name",
        moduleId: module.id,
        message: "module name must be non-empty",
      });
    }
    if (byId.has(module.id)) {
      issues.push({
        code: "duplicate_id",
        moduleId: module.id,
        message: `duplicate module id "${module.id}"`,
      });
      return;
    }
    byId.set(module.id, module);
  });

  for (const module of byId.values()) {
    for (const dep of module.dependencies) {
      if (dep === module.id) {
        issues.push({
          code: "self_dependency",
          moduleId: module.id,
          message: "module cannot depend on itself",
          dependencyId: dep,
        });
        continue;
      }
      if (!byId.has(dep)) {
        issues.push({
          code: "missing_dependency",
          moduleId: module.id,
          message: `dependency "${dep}" is not registered`,
          dependencyId: dep,
        });
      }
    }
  }

  return issues;
}

export type PlatformModuleRegistryDocument = {
  version: typeof PLATFORM_MODULE_REGISTRY_VERSION;
  modules: readonly PlatformModule[];
};

/** Versioned document shape for future persistence / export. */
export function getPlatformModuleRegistryDocument(): PlatformModuleRegistryDocument {
  return {
    version: PLATFORM_MODULE_REGISTRY_VERSION,
    modules: PLATFORM_MODULE_REGISTRY,
  };
}
