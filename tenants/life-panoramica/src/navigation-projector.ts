/**
 * Navigation Projector (Phase D.0.3).
 *
 * Generates hamburger Explorer + Account navigation from:
 *   Platform modules (existence) + TenantConfiguration (availability)
 *   + catalogs (content) + capabilities (action-gated leaves).
 *
 * Does not replace explorer-nav / official-entities / service-near-hubs.
 * Does not grant Permissions.
 */

import type { TenantConfiguration } from "@life-community-os/types";
import { isTenantModuleEnabled } from "@life-community-os/types";

import { CAPABILITIES } from "./capabilities";
import {
  listExplorerActivities,
  type ExplorerNavLeaf,
} from "./explorer-nav";
import type { TenantFeatureFlags } from "./features";
import {
  listOfficialEntities,
  officialEntityNavIcon,
  officialEntityNavLabel,
  type OfficialEntityProfile,
} from "./official-entities";
import {
  nearCategoryHubs,
  servicesCategoryHubs,
  type NearCategoryHub,
  type ServicesCategoryHub,
} from "./service-near-hubs";

/** Mirrors AppMenuLeafIcon in @life-community-os/ui — kept local to avoid UI package cycles. */
export type ProjectedNavIcon = ExplorerNavLeaf["icon"] | "briefcase" | "pin" | "family" | "culture" | "public" | "admin" | "city" | "security";

export type ProjectedNavArea = "explorer" | "account";

export type ProjectedNavLeaf = {
  id: string;
  label: string;
  icon?: ProjectedNavIcon;
  href?: string;
  /** Special actions that are not routes. */
  action?: "sign_out";
  /** Capability required to show this leaf (AuthZ) — not module availability. */
  requireCapability?: string;
};

export type ProjectedNavCategory = {
  id: string;
  label: string;
  description: string;
  tone:
    | "community"
    | "activities"
    | "experiences"
    | "reservations"
    | "exchange"
    | "local"
    | "official"
    | "profile";
  glyph?: string;
  area: ProjectedNavArea;
  /** Root module id that gates this category. */
  moduleId?: string;
  children: ProjectedNavLeaf[];
};

export type NavigationProjectorInput = {
  configuration: TenantConfiguration;
  hasCapability: (key: string) => boolean;
  /**
   * Sub-feature slices still living on TenantFeatureFlags
   * (e.g. mobility, decide) until they become registry modules.
   */
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
  activityLeaves?: readonly ExplorerNavLeaf[];
  serviceHubs?: readonly ServicesCategoryHub[];
  nearHubs?: readonly NearCategoryHub[];
  officialEntities?: readonly OfficialEntityProfile[];
};

function moduleOn(
  configuration: TenantConfiguration,
  moduleId: string,
): boolean {
  return isTenantModuleEnabled(configuration, moduleId);
}

function activityModuleIdFromHref(href: string): string | undefined {
  const match = /^\/activities\/([^/?#]+)/.exec(href);
  return match?.[1];
}

function officialModuleId(entity: OfficialEntityProfile): string {
  switch (entity.kind) {
    case "territory_authority":
      return "administration";
    case "municipality":
      return "municipality";
    case "public_service":
      return "publicServices";
    case "other_official":
      return entity.slug === "seguridad" ? "security" : "official";
    default:
      return "official";
  }
}

function serviceLeafIcon(
  slug: ServicesCategoryHub["slug"],
): ProjectedNavIcon {
  switch (slug) {
    case "professionals":
      return "briefcase";
    case "work":
      return "briefcase";
    case "neighbour-help":
      return "handshake";
    case "mobility":
      return "car";
    case "recommendations":
      return "culture";
    default:
      return "service";
  }
}

function nearLeafIcon(slug: NearCategoryHub["slug"]): ProjectedNavIcon {
  switch (slug) {
    case "restaurants":
      return "restaurant";
    case "businesses":
      return "shop";
    case "services":
      return "service";
    case "places":
      return "place";
    default:
      return "place";
  }
}

function filterLeavesByCapability(
  leaves: ProjectedNavLeaf[],
  hasCapability: (key: string) => boolean,
): ProjectedNavLeaf[] {
  return leaves.filter((leaf) => {
    if (!leaf.requireCapability) return true;
    return hasCapability(leaf.requireCapability);
  });
}

/**
 * Project configuration → navigation model (href/action based, no router).
 */
export function projectMemberNavigation(
  input: NavigationProjectorInput,
): ProjectedNavCategory[] {
  const {
    configuration,
    hasCapability,
    isFeatureEnabled,
    activityLeaves = listExplorerActivities(),
    serviceHubs = servicesCategoryHubs,
    nearHubs = nearCategoryHubs,
    officialEntities = listOfficialEntities(),
  } = input;

  const categories: ProjectedNavCategory[] = [];

  // ── AREA 1 — Community Explorer ─────────────────────────────

  if (moduleOn(configuration, "community")) {
    const children: ProjectedNavLeaf[] = [
      {
        id: "c-news",
        label: "Actualidad",
        icon: "info",
        href: "/community?tab=conversaciones",
      },
    ];
    if (moduleOn(configuration, "community.proposals")) {
      children.push({
        id: "c-proposals",
        label: "Propuestas",
        icon: "proposal",
        href: "/community?tab=propuestas",
      });
      if (isFeatureEnabled("decide")) {
        children.push({
          id: "c-participation",
          label: "Participación",
          icon: "help",
          href: "/community?tab=propuestas",
        });
      }
    }
    if (moduleOn(configuration, "community.channels")) {
      children.push({
        id: "c-spaces",
        label: "Espacios comunitarios",
        icon: "people",
        href: "/community?tab=canales",
      });
    }
    if (moduleOn(configuration, "community.pets")) {
      children.push({
        id: "c-pets",
        label: "Mascotas",
        icon: "family",
        href: "/community?tab=conversaciones",
      });
    }
    categories.push({
      id: "community",
      area: "explorer",
      moduleId: "community",
      tone: "community",
      glyph: "🏡",
      label: "Comunidad",
      description: "Comunicación y participación vecinal",
      children,
    });
  }

  if (moduleOn(configuration, "activities")) {
    const children = activityLeaves
      .filter((item) => {
        const activityId = activityModuleIdFromHref(item.href);
        if (!activityId) return true;
        return moduleOn(configuration, activityId);
      })
      .map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon as ProjectedNavIcon,
        href: item.href,
      }));
    if (children.length > 0) {
      categories.push({
        id: "activities",
        area: "explorer",
        moduleId: "activities",
        tone: "activities",
        glyph: "🎯",
        label: "Actividades",
        description: "Intereses permanentes de la comunidad",
        children,
      });
    }
  }

  if (moduleOn(configuration, "experiences")) {
    const children: ProjectedNavLeaf[] = [
      {
        id: "exp-upcoming",
        label: "Próximas",
        icon: "calendar",
        href: "/experiences",
      },
      {
        id: "exp-create",
        label: "Crear experiencia",
        icon: "proposal",
        href: "/experiences/create",
        requireCapability: CAPABILITIES.experienceCreate,
      },
    ];
    categories.push({
      id: "experiences",
      area: "explorer",
      moduleId: "experiences",
      tone: "experiences",
      glyph: "✨",
      label: "Experiencias",
      description: "Momentos para crear y unirte",
      children: filterLeavesByCapability(children, hasCapability),
    });
  }

  if (moduleOn(configuration, "reservations")) {
    categories.push({
      id: "reservations",
      area: "explorer",
      moduleId: "reservations",
      tone: "reservations",
      glyph: "📅",
      label: "Reservas",
      description: "Qué puedes usar y cuándo está libre",
      children: [
        {
          id: "res-sports",
          label: "Instalaciones",
          icon: "sport",
          href: "/resources",
        },
        {
          id: "res-common",
          label: "Espacios comunes",
          icon: "place",
          href: "/resources",
        },
      ],
    });
  }

  if (moduleOn(configuration, "services")) {
    const children: ProjectedNavLeaf[] = [];
    for (const hub of serviceHubs) {
      const flagsOk = hub.featureKeys.some((key) => isFeatureEnabled(key));
      if (!flagsOk) continue;
      children.push({
        id: `svc-${hub.slug}`,
        label: hub.label,
        icon: serviceLeafIcon(hub.slug),
        href: `/services/${hub.slug}`,
      });
    }
    if (
      moduleOn(configuration, "marketplace") &&
      hasCapability(CAPABILITIES.marketplaceView)
    ) {
      children.push({
        id: "svc-market",
        label: "Compra y venta",
        icon: "cart",
        href: "/marketplace",
        requireCapability: CAPABILITIES.marketplaceView,
      });
    }
    if (children.length > 0) {
      categories.push({
        id: "services",
        area: "explorer",
        moduleId: "services",
        tone: "exchange",
        glyph: "🛠",
        label: "Servicios",
        description: "Ayuda, profesionales y soluciones cercanas",
        children: filterLeavesByCapability(children, hasCapability),
      });
    }
  }

  if (
    moduleOn(configuration, "nearby") &&
    hasCapability(CAPABILITIES.localView)
  ) {
    categories.push({
      id: "near",
      area: "explorer",
      moduleId: "nearby",
      tone: "local",
      glyph: "📍",
      label: "Cerca de ti",
      description: "Lo que hay alrededor",
      children: nearHubs.map((hub) => ({
        id: `near-${hub.slug}`,
        label: hub.label,
        icon: nearLeafIcon(hub.slug),
        href: `/near/${hub.slug}`,
      })),
    });
  }

  if (moduleOn(configuration, "official")) {
    const children = officialEntities
      .filter((entity) => moduleOn(configuration, officialModuleId(entity)))
      .map((entity) => ({
        id: `o-${entity.slug}`,
        label: officialEntityNavLabel(entity),
        icon: officialEntityNavIcon(entity) as ProjectedNavIcon,
        href: `/official/${entity.slug}`,
      }));

    if (children.length > 0) {
      categories.push({
        id: "official",
        area: "explorer",
        moduleId: "official",
        tone: "official",
        glyph: "🏛",
        label: "Oficial",
        description: "Información de entidades responsables",
        children,
      });
    }
  }

  // ── AREA 2 — Personal account (inside hamburger) ────────────

  if (moduleOn(configuration, "identity")) {
    const children: ProjectedNavLeaf[] = [
      {
        id: "p-identity",
        label: "Mi identidad",
        icon: "people",
        href: "/me",
      },
      {
        id: "p-residency",
        label: "Mi residencia",
        icon: "pin",
        href: "/me",
      },
      {
        id: "p-interests",
        label: "Mis intereses",
        icon: "games",
        href: "/me",
      },
      {
        id: "p-activity",
        label: "Mi actividad",
        icon: "calendar",
        href:
          moduleOn(configuration, "experiences") || isFeatureEnabled("calendar")
            ? "/calendar"
            : "/me",
      },
    ];
    if (moduleOn(configuration, "reservations")) {
      children.push({
        id: "p-reservations",
        label: "Mis reservas",
        icon: "sport",
        href: "/reservations",
      });
    }
    children.push(
      {
        id: "p-saved",
        label: "Mis guardados",
        icon: "info",
        href: moduleOn(configuration, "experiences") ? "/experiences" : "/me",
      },
      {
        id: "p-settings",
        label: "Configuración",
        icon: "service",
        href: "/me",
      },
      {
        id: "p-sign-out",
        label: "Cerrar sesión",
        icon: "info",
        action: "sign_out",
      },
    );

    categories.push({
      id: "profile",
      area: "account",
      moduleId: "identity",
      tone: "profile",
      glyph: "👤",
      label: "Mi perfil",
      description: "Tu identidad y tu relación con la comunidad",
      children,
    });
  }

  return categories;
}

export type BoundNavLeaf = {
  id: string;
  label: string;
  icon?: ProjectedNavIcon;
  onSelect: () => void;
};

export type BoundNavCategory = {
  id: string;
  label: string;
  description: string;
  tone: ProjectedNavCategory["tone"];
  glyph?: string;
  area: ProjectedNavArea;
  children: BoundNavLeaf[];
};

/**
 * Bind projected href/action model to UI callbacks (MemberShell).
 */
export function bindProjectedNavigation(
  projected: readonly ProjectedNavCategory[],
  handlers: {
    onNavigate: (href: string) => void;
    onSignOut?: () => void;
  },
): BoundNavCategory[] {
  return projected.map((category) => ({
    id: category.id,
    label: category.label,
    description: category.description,
    tone: category.tone,
    glyph: category.glyph,
    area: category.area,
    children: category.children.map((leaf) => ({
      id: leaf.id,
      label: leaf.label,
      icon: leaf.icon,
      onSelect: () => {
        if (leaf.action === "sign_out") {
          handlers.onSignOut?.();
          return;
        }
        if (leaf.href) handlers.onNavigate(leaf.href);
      },
    })),
  }));
}

/** Leaf labels under Oficial — useful for validation. */
export function listProjectedOfficialLabels(
  projected: readonly ProjectedNavCategory[],
): string[] {
  const official = projected.find((c) => c.id === "official");
  return official?.children.map((c) => c.label) ?? [];
}
