import type {
  TenantBrandTokens,
  TenantColorTokens,
  TenantThemeMode,
} from "./semantic";
import { motion, radius, shadow, space } from "./global";

/** Resolves the palette a mode should render with. */
export function resolveTenantPalette(
  theme: TenantBrandTokens,
  mode?: TenantThemeMode,
): TenantColorTokens {
  const requested = mode ?? theme.defaultMode;
  if (requested && theme.modes?.[requested]) {
    return theme.modes[requested] as TenantColorTokens;
  }
  return theme.colors;
}

/** Maps tenant brand tokens → CSS custom properties for the document root. */
export function tenantThemeToCssVars(
  theme: TenantBrandTokens,
  mode?: TenantThemeMode,
): Record<string, string> {
  const c = resolveTenantPalette(theme, mode);
  const onAction = c.textOnAction ?? c.textInverse;
  const glass = c.surfaceGlass ?? c.bgElevated;
  const glassStrong = c.surfaceGlassStrong ?? c.bgElevated;
  return {
    "--color-surface-app": c.bgApp,
    "--color-surface-elevated": c.bgElevated,
    "--color-surface-muted": c.bgMuted,
    "--color-surface-glass": glass,
    "--color-surface-glass-strong": glassStrong,
    "--color-chrome-surface": c.chromeSurface ?? c.bgElevated,
    "--gradient-surface-app": c.appGradient ?? c.bgApp,
    "--color-text-primary": c.textPrimary,
    "--color-text-secondary": c.textSecondary,
    "--color-text-tertiary": c.textTertiary,
    "--color-text-inverse": c.textInverse,
    "--color-text-on-action": onAction,
    "--color-border-subtle": c.borderSubtle,
    "--color-border-strong": c.borderStrong,
    "--color-border-glass": c.borderGlass ?? c.borderSubtle,
    "--color-action-primary": c.brandPrimary,
    "--color-action-primary-hover": c.brandPrimaryHover,
    "--color-action-primary-subtle": c.brandPrimarySubtle,
    "--color-action-secondary": c.brandSecondary,
    "--color-action-accent": c.brandAccent,
    "--color-action-accent-subtle": c.brandAccentSubtle,
    "--color-action-destructive": c.danger,
    "--color-feedback-success": c.success,
    "--color-feedback-success-subtle": c.successSubtle,
    "--color-feedback-warning": c.warning,
    "--color-feedback-warning-subtle": c.warningSubtle,
    "--color-feedback-danger": c.danger,
    "--color-feedback-danger-subtle": c.dangerSubtle,
    "--color-feedback-info": c.info,
    "--color-feedback-info-subtle": c.infoSubtle,
    "--color-accent-community": c.brandAccent,
    "--color-accent-official": c.brandPrimary,
    "--color-accent-cyan": c.accentCyan ?? c.brandSea,
    "--color-accent-cyan-subtle": c.accentCyanSubtle ?? c.brandSeaSubtle,
    "--color-accent-turquoise": c.accentTurquoise ?? c.accentCyan ?? c.brandSea,
    "--color-accent-lime": c.accentLime ?? c.brandAccent,
    "--color-accent-lime-subtle": c.accentLimeSubtle ?? c.brandAccentSubtle,
    "--gradient-brand":
      c.brandGradient ??
      `linear-gradient(135deg, ${c.accentCyan ?? c.brandPrimary} 0%, ${c.accentTurquoise ?? c.accentCyan ?? c.brandSea} 48%, ${c.accentLime ?? c.brandAccent} 100%)`,
    "--color-hero-scrim": c.bgHeroScrim,
    "--color-sea": c.brandSea,
    "--color-sea-subtle": c.brandSeaSubtle,
    "--radius-sm": radius.sm,
    "--radius-md": radius.md,
    "--radius-lg": radius.lg,
    "--radius-xl": radius.xl,
    "--shadow-elev-1": c.shadowElev1 ?? shadow.elev1,
    "--shadow-elev-2": c.shadowElev2 ?? shadow.elev2,
    "--space-4": space[4],
    "--space-6": space[6],
    "--motion-fast": motion.fast,
    "--motion-base": motion.base,
    "--motion-slow": motion.slow,
    "--motion-easing": motion.easing,
  };
}
