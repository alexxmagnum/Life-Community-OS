import type { TenantBrandTokens } from "@life-community-os/design-tokens";

/**
 * Life Panoramica — Layer 3 tenant theme.
 * Swap this pack for another tenant without changing UI components.
 */
export const lifePanoramicaTheme: TenantBrandTokens = {
  name: "Life Panoramica",
  shortName: "Panoramica",
  logoText: "Life Panoramica",
  tagline: "Tu comunidad, viva",
  identity: {
    territoryName: "Panorámica Golf",
    defaultAreaName: "Aldea Golf",
    homeCallout: "Hoy en Panorámica Golf",
    pulseTitleTemplate: "Hoy en {territory}",
    weatherLabel: "24° · Soleado",
  },
  colors: {
    brandPrimary: "#1F4A3C",
    brandPrimaryHover: "#183A30",
    brandPrimarySubtle: "#E7F0EC",
    brandSecondary: "#5C6B63",
    brandAccent: "#C47A3A",
    brandAccentSubtle: "#F8EFE6",
    brandSea: "#3D6B7A",
    brandSeaSubtle: "#E8F1F4",
    bgApp: "#F6F3EE",
    bgElevated: "#FFFFFF",
    bgMuted: "#ECE7E0",
    bgHeroScrim: "rgba(20, 28, 24, 0.42)",
    textPrimary: "#1A1F1C",
    /** Darker secondary — readable for older residents on linen. */
    textSecondary: "#3E4642",
    textTertiary: "#5F6762",
    textInverse: "#FFFFFF",
    borderSubtle: "#E2DDD6",
    borderStrong: "#C9C2B8",
    success: "#2F6F4E",
    successSubtle: "#E6F4EC",
    warning: "#B8860B",
    warningSubtle: "#FBF3DC",
    danger: "#B42318",
    dangerSubtle: "#F8E8E6",
    info: "#3D6B7A",
    infoSubtle: "#E8F1F4",
  },
  imagery: {
    splash:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
    homeHero: "/tenants/life-panoramica/home-hero.png",
    logo: "/tenants/life-panoramica/logo.png",
  },
};
