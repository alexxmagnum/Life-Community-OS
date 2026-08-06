import type { TenantBrandTokens } from "./semantic";
import { motion, radius, shadow, space } from "./global";

/** Maps tenant brand tokens → CSS custom properties for the document root. */
export function tenantThemeToCssVars(
  theme: TenantBrandTokens,
): Record<string, string> {
  const c = theme.colors;
  return {
    "--color-surface-app": c.bgApp,
    "--color-surface-elevated": c.bgElevated,
    "--color-surface-muted": c.bgMuted,
    "--color-text-primary": c.textPrimary,
    "--color-text-secondary": c.textSecondary,
    "--color-text-tertiary": c.textTertiary,
    "--color-text-inverse": c.textInverse,
    "--color-border-subtle": c.borderSubtle,
    "--color-border-strong": c.borderStrong,
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
    "--color-hero-scrim": c.bgHeroScrim,
    "--color-sea": c.brandSea,
    "--color-sea-subtle": c.brandSeaSubtle,
    "--radius-sm": radius.sm,
    "--radius-md": radius.md,
    "--radius-lg": radius.lg,
    "--radius-xl": radius.xl,
    "--shadow-elev-1": shadow.elev1,
    "--shadow-elev-2": shadow.elev2,
    "--space-4": space[4],
    "--space-6": space[6],
    "--motion-fast": motion.fast,
    "--motion-base": motion.base,
    "--motion-slow": motion.slow,
    "--motion-easing": motion.easing,
  };
}
