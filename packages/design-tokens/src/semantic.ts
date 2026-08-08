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
  | "hero.scrim";

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
    /** Hero context line under greeting (e.g. “Tu comunidad hoy”) */
    homeCallout?: string;
    /**
     * Community pulse section title.
     * Supports `{territory}` placeholder — never hardcode tenant names in UI.
     */
    pulseTitleTemplate?: string;
    /**
     * Optional weather line for belonging hero overlay (demo/config).
     * Not shown in global header.
     */
    weatherLabel?: string;
  };
  colors: {
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
    textInverse: string;
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
  };
  imagery: {
    splash: string;
    homeHero: string;
    /** Optional brand mark / lockup for chrome (header, menu). */
    logo?: string;
  };
};
