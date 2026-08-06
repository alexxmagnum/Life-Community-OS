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
  };
};
