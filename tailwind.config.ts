import type { Config } from "tailwindcss";

/**
 * Identidad visual de Camino de Fe (v2): cálida, serena, moderna.
 * Los colores se exponen como variables CSS (ver app/globals.css) para soportar
 * modo claro/oscuro (preferencia del sistema o `data-theme`).
 */
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        surface: token("surface"),
        foreground: token("foreground"),
        muted: token("muted"),
        "muted-foreground": token("muted-foreground"),
        border: token("border"),
        primary: token("primary"),
        "primary-foreground": token("primary-foreground"),
        "primary-soft": token("primary-soft"),
        accent: token("accent"),
        "accent-foreground": token("accent-foreground"),
        "accent-soft": token("accent-soft"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px hsl(var(--shadow) / 0.05), 0 8px 24px -12px hsl(var(--shadow) / 0.18)",
        lift: "0 2px 4px hsl(var(--shadow) / 0.06), 0 18px 40px -18px hsl(var(--shadow) / 0.3)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
