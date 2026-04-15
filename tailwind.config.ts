import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Rouxtine Brand Palette ─────────────────────────────────────
        bg: {
          DEFAULT: "#F7F5F2",   // Ivoire — app background
          warm: "#EEECEA",      // slightly deeper surface
          card: "#FFFFFF",      // Blanc — card surfaces
        },
        ink: {
          DEFAULT: "#0F0F0F",   // Noir — primary text
          light: "#444444",     // Darkgrey — secondary text
          muted: "#888888",     // Gris — metadata, placeholders
        },
        accent: {
          DEFAULT: "#E8200F",   // Rouge Vif — CTAs, highlights
          light: "#F5A099",     // tinted rouge for hover indicators
          bg: "#FDF0EE",        // very light rouge tint for active backgrounds
        },
        border: "#E5E3DF",      // Gris Clair — dividers, input borders
        danger: {
          DEFAULT: "#BB4444",
          bg: "#FFF0F0",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-playfair)",
          "Georgia",
          "serif",
        ],
        script: [
          "var(--font-petit-formal)",
          "cursive",
        ],
      },
      borderRadius: {
        card: "14px",
        input: "12px",
        pill: "50px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 15, 15, 0.07)",
        "card-hover": "0 12px 32px rgba(15, 15, 15, 0.11)",
        modal: "0 20px 60px rgba(15, 15, 15, 0.14)",
        toast: "0 8px 24px rgba(232, 32, 15, 0.20)",
        button: "0 4px 12px rgba(232, 32, 15, 0.22)",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateX(-50%) translateY(20px)" },
          "100%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "modal-in": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up": "fade-up 0.35s ease",
        "modal-in": "modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
