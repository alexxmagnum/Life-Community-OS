/**
 * Layer 2 — Semantic product token keys.
 * Values come from tenant theme (Layer 3) at runtime.
 */

export type SemanticColorToken =
  | "surface.app"
  | "surface.elevated"
  | "surface.muted"
  | "text.primary"
  | "text.secondary"
  | "text.tertiary"
  | "text.inverse"
  | "border.subtle"
  | "border.strong"
  | "action.primary"
  | "action.primaryHover"
  | "action.primarySubtle"
  | "action.secondary"
  | "action.accent"
  | "action.accentSubtle"
  | "action.destructive"
  | "feedback.success"
  | "feedback.successSubtle"
  | "feedback.warning"
  | "feedback.warningSubtle"
  | "feedback.danger"
  | "feedback.dangerSubtle"
  | "feedback.info"
  | "feedback.infoSubtle"
  | "accent.community"
  | "accent.official"
  | "hero.scrim"
  | "surface.glass"
  | "surface.glassStrong"
  | "border.glass"
  | "accent.cyan"
  | "accent.lime"
  | "text.onAction";

/**
 * Visual identity mode. `night` is the Life Premium identity;
 * `day` is the light identity. `system` selection is a future concern —
 * the platform resolves a single mode per tenant for now.
 */
export type TenantThemeMode = "night" | "day";

/** One resolved palette. Optional keys degrade to platform defaults. */
export type TenantColorTokens = {
  brandPrimary: string;
  brandPrimaryHover: string;
  brandPrimarySubtle: string;
  brandSecondary: string;
  brandAccent: string;
  brandAccentSubtle: string;
  brandSea: string;
  brandSeaSubtle: string;
  bgApp: string;
  bgElevated: string;
  bgMuted: string;
  bgHeroScrim: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** Text over photography and scrims. Stays light in every mode. */
  textInverse: string;
  /**
   * Text sitting on a primary action fill. Light modes reuse `textInverse`;
   * dark modes need ink because the accent itself is bright.
   */
  textOnAction?: string;
  borderSubtle: string;
  borderStrong: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  /** Translucent card fill for glass surfaces. */
  surfaceGlass?: string;
  surfaceGlassStrong?: string;
  /**
   * Fill for fixed chrome (header, bottom nav). Carries its own alpha so
   * chrome can float over content without an opacity modifier.
   */
  chromeSurface?: string;
  /** Hairline over glass. */
  borderGlass?: string;
  accentCyan?: string;
  accentCyanSubtle?: string;
  /** Motans turquoise — middle stop of the brand gradient. */
  accentTurquoise?: string;
  accentLime?: string;
  accentLimeSubtle?: string;
  /** Ambient page background. Replaces the flat app surface when present. */
  appGradient?: string;
  /** Primary brand gradient (CTAs, FAB, active chrome). */
  brandGradient?: string;
  /** Mode-specific elevation — dark modes need deeper ambient shadow. */
  shadowElev1?: string;
  shadowElev2?: string;
};

export type TenantBrandTokens = {
  name: string;
  shortName?: string;
  logoText: string;
  tagline?: string;
  /**
   * Place belonging for Home and local context.
   * Platform UI receives these as props — never hardcode tenant names.
   */
  identity?: {
    /** Territory / place name shown as Home hero eyebrow */
    territoryName: string;
    /** Default area / microzone when member context is unset */
    defaultAreaName: string;
    /** Administrative municipality shown in chrome next to weather */
    municipalityName?: string;
    /** Chrome wordmark, first line (e.g. “Life”). */
    wordmarkPrimary?: string;
    /** Chrome wordmark, second line (e.g. “Panorámica”). */
    wordmarkSecondary?: string;
    /** Hero context line under greeting (e.g. “Tu comunidad hoy”) */
    homeCallout?: string;
    /**
     * Community pulse section title.
     * Supports `{territory}` placeholder — never hardcode tenant names in UI.
     */
    pulseTitleTemplate?: string;
    /** Optional weather line for the hero overlay (demo/config). */
    weatherLabel?: string;
    /** Formatted temperature for chrome and hero (e.g. “24°”). */
    weatherTemperature?: string;
    /** Short sky condition (e.g. “Soleado”). */
    weatherCondition?: string;
  };
  /** Base palette. Used when no mode palette matches. */
  colors: TenantColorTokens;
  /** Mode palettes. Absent modes fall back to `colors`. */
  modes?: Partial<Record<TenantThemeMode, TenantColorTokens>>;
  /** Identity the platform resolves when no user preference exists. */
  defaultMode?: TenantThemeMode;
  imagery: {
    splash: string;
    homeHero: string;
    /** Optional brand mark / lockup for chrome (header, menu). */
    logo?: string;
    /** Brand mark for dark chrome. Falls back to `logo`, then `logoText`. */
    logoLight?: string;
    /** Home hero rotation. Falls back to `homeHero` when empty. */
    homeHeroSlides?: ReadonlyArray<string>;
    /**
     * Timed hero windows for Life Premium Home.
     * Order: night (20–08) · morning (08–12) · afternoon (12–18) · evening (18–20).
     * Prefer this over `homeHeroSlides` when present.
     */
    homeHeroWindows?: {
      night: string;
      morning: string;
      afternoon: string;
      evening: string;
    };
  };
};
