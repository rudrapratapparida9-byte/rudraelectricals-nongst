import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep charcoal-indigo — the "shop counter at closing time" base
        ink: {
          950: "#0B0F17",
          900: "#111827",
          800: "#1B2333",
          700: "#28324A",
          600: "#3B4666",
        },
        // Copper/amber accent — evokes bare copper wire & warning tape,
        // not a generic SaaS blue
        copper: {
          400: "#F2A65A",
          500: "#E08A2E",
          600: "#C06A14",
        },
        // Muted teal for success / positive stock states
        circuit: {
          400: "#5EC7B7",
          500: "#3AA893",
        },
        canvas: "#F7F6F3",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(11,15,23,0.06), 0 1px 0 rgba(11,15,23,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
