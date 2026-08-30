/**
 * Platform navigation contract — visibility only.
 * Authorization is enforced on the server. UI may hide; it never grants.
 */

import { isTenantModuleEnabled, type TenantConfiguration } from "./tenant-configuration";
import type { ProductCapabilityKey } from "./tenant-contract";
import { CAPABILITIES, type TenantFeatureFlags } from "./capabilities";

export type ProjectedNavIcon = string;

export type ProjectedNavArea = "explorer" | "account";

export type ProjectedNavLeaf = {
  id: string;
  label: string;
  icon?: ProjectedNavIcon;
  href?: string;
  action?: "sign_out";
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
  moduleId?: string;
  children: ProjectedNavLeaf[];
};

export type PlatformNavigationInput = {
  configuration: TenantConfiguration;
  hasCapability: (key: string) => boolean;
  isFeatureEnabled: (key: keyof TenantFeatureFlags) => boolean;
  isProductCapabilityEnabled?: (key: ProductCapabilityKey) => boolean;
};

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

/** UI visibility: module/feature on AND capability if required. Not AuthZ. */
export function navItemVisible(input: {
  featureEnabled: boolean;
  requiredCapability?: string;
  hasCapability: (key: string) => boolean;
}): boolean {
  if (!input.featureEnabled) return false;
  if (!input.requiredCapability) return true;
  return input.hasCapability(input.requiredCapability);
}

export function filterLeavesByCapability(
  leaves: ProjectedNavLeaf[],
  hasCapability: (key: string) => boolean,
): ProjectedNavLeaf[] {
  return leaves.filter((leaf) =>
    navItemVisible({
      featureEnabled: true,
      requiredCapability: leaf.requireCapability,
      hasCapability,
    }),
  );
}

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

/**
 * Tenant-neutral hamburger. No pack catalogs, no golf unless the
 * product capability is enabled. Does not grant permissions.
 */
export function projectPlatformNavigation(
  input: PlatformNavigationInput,
): ProjectedNavCategory[] {
  const { configuration, hasCapability, isProductCapabilityEnabled } = input;
  const moduleOn = (id: string) => isTenantModuleEnabled(configuration, id);
  const productOn = (key: ProductCapabilityKey) =>
    isProductCapabilityEnabled ? isProductCapabilityEnabled(key) : true;

  const categories: ProjectedNavCategory[] = [];

  if (moduleOn("community")) {
    categories.push({
      id: "community",
      area: "explorer",
      moduleId: "community",
      tone: "community",
      glyph: "🏡",
      label: "Comunidad",
      description: "La vida de la comunidad",
      children: [{ id: "c-home", label: "Comunidad", href: "/community" }],
    });
  }

  if (moduleOn("experiences")) {
    categories.push({
      id: "experiences",
      area: "explorer",
      moduleId: "experiences",
      tone: "experiences",
      glyph: "✨",
      label: "Experiencias",
      description: "Momentos para crear y unirte",
      children: filterLeavesByCapability(
        [
          { id: "exp-upcoming", label: "Próximas", href: "/experiences" },
          {
            id: "exp-create",
            label: "Crear experiencia",
            href: "/experiences/create",
            requireCapability: CAPABILITIES.experienceCreate,
          },
        ],
        hasCapability,
      ),
    });
  }

  if (moduleOn("golf") && productOn("golf")) {
    categories.push({
      id: "activities",
      area: "explorer",
      moduleId: "golf",
      tone: "activities",
      glyph: "⛳",
      label: "Actividades",
      description: "Intereses de la comunidad",
      children: [{ id: "act-golf", label: "Golf", href: "/activities/golf" }],
    });
  }

  if (moduleOn("reservations")) {
    categories.push({
      id: "reservations",
      area: "explorer",
      moduleId: "reservations",
      tone: "reservations",
      glyph: "📅",
      label: "Reservas",
      description: "Espacios y disponibilidad",
      children: [
        { id: "res-common", label: "Espacios comunes", href: "/resources" },
      ],
    });
  }

  if (
    moduleOn("marketplace") &&
    productOn("marketplace") &&
    hasCapability(CAPABILITIES.marketplaceView)
  ) {
    categories.push({
      id: "services",
      area: "explorer",
      moduleId: "marketplace",
      tone: "exchange",
      glyph: "🛠",
      label: "Servicios",
      description: "Intercambio entre vecinos",
      children: [
        {
          id: "svc-market",
          label: "Compra y venta",
          href: "/marketplace",
          requireCapability: CAPABILITIES.marketplaceView,
        },
      ],
    });
  }

  if (moduleOn("housing") && hasCapability(CAPABILITIES.housingView)) {
    categories.push({
      id: "housing",
      area: "explorer",
      moduleId: "housing",
      tone: "local",
      glyph: "🏠",
      label: "Vivienda",
      description: "Propiedades de la comunidad",
      children: [{ id: "h-list", label: "Vivienda", href: "/housing" }],
    });
  }

  if (moduleOn("lifeMap") && hasCapability(CAPABILITIES.lifeMapView)) {
    categories.push({
      id: "map",
      area: "explorer",
      moduleId: "lifeMap",
      tone: "local",
      glyph: "🗺",
      label: "Mapa",
      description: "Territorio",
      children: [{ id: "map-open", label: "Life Map", href: "/map" }],
    });
  }

  if (hasCapability(CAPABILITIES.manageEnter)) {
    categories.push({
      id: "admin",
      area: "account",
      tone: "official",
      glyph: "⚙",
      label: "Administración",
      description: "Operar la comunidad",
      children: [{ id: "admin-open", label: "Operations Center", href: "/admin" }],
    });
  }

  if (moduleOn("identity")) {
    categories.push({
      id: "account",
      area: "account",
      moduleId: "identity",
      tone: "profile",
      label: "Cuenta",
      description: "Tu perfil",
      children: [
        { id: "p-profile", label: "Mi perfil", href: "/me" },
        { id: "p-sign-out", label: "Cerrar sesión", action: "sign_out" },
      ],
    });
  }

  return categories;
}
