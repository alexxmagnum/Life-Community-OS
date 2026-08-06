/**
 * Layer 1 — Global platform tokens.
 * Stable across tenants. Components must not hardcode these values.
 */

export const space = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

export const radius = {
  sm: "10px",
  md: "16px",
  lg: "22px",
  xl: "28px",
  full: "9999px",
} as const;

export const shadow = {
  elev0: "none",
  elev1:
    "0 1px 2px rgba(26, 31, 28, 0.06), 0 4px 16px rgba(26, 31, 28, 0.04)",
  elev2:
    "0 8px 28px rgba(26, 31, 28, 0.12), 0 2px 8px rgba(26, 31, 28, 0.06)",
} as const;

export const motion = {
  fast: "140ms",
  base: "220ms",
  slow: "360ms",
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const typography = {
  fontSans: "var(--font-sans)",
  fontDisplay: "var(--font-display)",
  display: { size: "34px", line: "40px", weight: "600" },
  title1: { size: "28px", line: "34px", weight: "600" },
  title2: { size: "22px", line: "28px", weight: "600" },
  title3: { size: "18px", line: "24px", weight: "600" },
  body: { size: "17px", line: "26px", weight: "400" },
  bodyStrong: { size: "17px", line: "26px", weight: "600" },
  callout: { size: "16px", line: "24px", weight: "500" },
  caption: { size: "13px", line: "18px", weight: "500" },
  label: { size: "13px", line: "16px", weight: "600" },
  button: { size: "16px", line: "20px", weight: "600" },
} as const;

export const layout = {
  pagePaddingX: space[4],
  bottomNavClearance: "88px",
  contentMax: "1200px",
  touchMin: "44px",
} as const;
