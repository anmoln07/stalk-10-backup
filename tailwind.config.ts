import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // short viewports (landscape phones, small laptops): tighten the profile card
      screens: { short: { raw: "(max-height: 700px)" } },
      colors: { ink: "#0a0a08", fg: "#e7e9ea", paper: "#ECEAE2" },
      fontFamily: { anton: ["var(--font-anton)", "Impact", "sans-serif"] },
      transitionTimingFunction: { spring: "cubic-bezier(.2,.8,.2,1)" },
    },
  },
  plugins: [],
};
export default config;
