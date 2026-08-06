/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        surface: {
          app: "var(--color-surface-app)",
          elevated: "var(--color-surface-elevated)",
          muted: "var(--color-surface-muted)",
        },
        ink: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        brand: {
          DEFAULT: "var(--color-action-primary)",
          hover: "var(--color-action-primary-hover)",
          subtle: "var(--color-action-primary-subtle)",
          accent: "var(--color-action-accent)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        elev1: "var(--shadow-elev-1)",
        elev2: "var(--shadow-elev-2)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
