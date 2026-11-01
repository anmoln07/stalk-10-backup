import type { Config } from "tailwindcss";
const config: Config = {
  future: { hoverOnlyWhenSupported: true },
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // short viewports (landscape phones, small laptops): tighten the profile card
      screens: { short: { raw: "(max-height: 700px)" } },
      colors: { ink: "#0a0a08", fg: "#e7e9ea", paper: "#ECEAE2", neon: "#22E33A", "neon-deep": "#139A25", desk: "#3CCF7A", "desk-deep": "#1F8F4E" },
      fontFamily: {
        anton: ["var(--font-anton)", "Impact", "sans-serif"],
        inter: ["var(--font-inter)", "Helvetica Neue", "Arial", "sans-serif"],
        pixel: ["var(--font-pixel)", "monospace"],
        plex: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: { spring: "cubic-bezier(.2,.8,.2,1)" },
    },
  },
  plugins: [],
};
export default config;
