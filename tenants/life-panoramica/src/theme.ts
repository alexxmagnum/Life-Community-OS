import type { TenantBrandTokens } from "@life-community-os/design-tokens";

/**
 * Life Panoramica — Layer 3 tenant theme.
 * Swap this pack for another tenant without changing UI components.
 */
export const lifePanoramicaTheme: TenantBrandTokens = {
  name: "Life Panoramica",
  shortName: "Panorámica",
  logoText: "Life Panoramica",
  tagline: "Tu comunidad, viva",
  identity: {
    /** Resident-facing place name — match chrome brand (Life Panoramica). */
    territoryName: "Life Panoramica",
    defaultAreaName: "Aldea Golf",
    municipalityName: "Sant Jordi",
    homeCallout: "Hoy en Life Panoramica",
    pulseTitleTemplate: "Hoy en {territory}",
    wordmarkPrimary: "LIFE",
    wordmarkSecondary: "PANORÁMICA",
    weatherLabel: "24° · Soleado",
    weatherTemperature: "24°",
    weatherCondition: "Soleado",
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
  defaultMode: "night",
  modes: {
    /** Life Premium — the identity the whole app renders with today. */
    night: {
      // Motans identity — frozen Life Premium palette
      brandPrimary: "#00D8E8",
      brandPrimaryHover: "#00C8B4",
      brandPrimarySubtle: "rgba(0, 216, 232, 0.16)",
      brandSecondary: "#B8C5C8",
      brandAccent: "#B7F22A",
      brandAccentSubtle: "rgba(183, 242, 42, 0.16)",
      brandSea: "#00C8B4",
      brandSeaSubtle: "rgba(0, 200, 180, 0.16)",
      bgApp: "#001219",
      bgElevated: "#0B252D",
      bgMuted: "#071D25",
      bgHeroScrim: "rgba(0, 18, 25, 0.55)",
      textPrimary: "#F7FAFA",
      textSecondary: "#B8C5C8",
      textTertiary: "#7A8A8A",
      textInverse: "#FFFFFF",
      textOnAction: "#001219",
      borderSubtle: "rgba(255, 255, 255, 0.10)",
      borderStrong: "rgba(255, 255, 255, 0.16)",
      success: "#56D93A",
      successSubtle: "rgba(86, 217, 58, 0.16)",
      warning: "#E4F224",
      warningSubtle: "rgba(228, 242, 36, 0.16)",
      danger: "#FF5C5C",
      dangerSubtle: "rgba(255, 92, 92, 0.18)",
      info: "#00D8E8",
      infoSubtle: "rgba(0, 216, 232, 0.16)",
      chromeSurface: "rgba(0, 18, 25, 0.78)",
      surfaceGlass: "rgba(7, 29, 37, 0.86)",
      surfaceGlassStrong: "rgba(11, 37, 45, 0.92)",
      borderGlass: "rgba(255, 255, 255, 0.10)",
      accentCyan: "#00D8E8",
      accentCyanSubtle: "rgba(0, 216, 232, 0.16)",
      accentTurquoise: "#00C8B4",
      accentLime: "#B7F22A",
      accentLimeSubtle: "rgba(183, 242, 42, 0.16)",
      appGradient:
        "radial-gradient(circle at 50% 18%, rgba(0, 216, 232, 0.035), transparent 32rem), #001219",
      brandGradient:
        "linear-gradient(135deg, #00D8E8 0%, #00C8B4 52%, #B7F22A 100%)",
      shadowElev1:
        "0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 18, 25, 0.55)",
      shadowElev2:
        "0 14px 38px rgba(0, 0, 0, 0.6), 0 0 28px rgba(0, 216, 232, 0.12)",
    },
  },
  imagery: {
    splash:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
    homeHero: "/tenants/life-panoramica/hero/hero-afternoon.png",
    homeHeroWindows: {
      night: "/tenants/life-panoramica/hero/hero-night.png",
      morning: "/tenants/life-panoramica/hero/hero-morning.png",
      afternoon: "/tenants/life-panoramica/hero/hero-afternoon.png",
      evening: "/tenants/life-panoramica/hero/hero-evening.png",
    },
    homeHeroSlides: [
      "/tenants/life-panoramica/hero/hero-night.png",
      "/tenants/life-panoramica/hero/hero-morning.png",
      "/tenants/life-panoramica/hero/hero-afternoon.png",
      "/tenants/life-panoramica/hero/hero-evening.png",
    ],
    logo: "/tenants/life-panoramica/logo.png",
  },
};
