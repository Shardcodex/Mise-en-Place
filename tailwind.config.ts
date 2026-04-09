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
        bg: {
          DEFAULT: "#F2F2EE",
          warm: "#E8E6E0",
          card: "#FEFEFE",
        },
        ink: {
          DEFAULT: "#2D3436",
          light: "#5A625A",
          muted: "#8A928A",
        },
        accent: {
          DEFAULT: "#5E7E6B",
          light: "#A3B8A0",
          bg: "#EAF0EA",
        },
        herb: {
          DEFAULT: "#3D5E4B",
          light: "#EAF0EA",
        },
        berry: {
          DEFAULT: "#8A4A5A",
          light: "#F0E8EA",
        },
        honey: {
          DEFAULT: "#9A7A4A",
          light: "#F5EDE0",
        },
        border: "#D8DBD8",
        danger: {
          DEFAULT: "#BB4444",
          bg: "#FFF0F0",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-work-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "14px",
        input: "12px",
        pill: "50px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(45, 52, 54, 0.08)",
        "card-hover": "0 12px 32px rgba(45, 52, 54, 0.12)",
        modal: "0 20px 60px rgba(45, 52, 54, 0.15)",
        toast: "0 8px 24px rgba(61, 94, 75, 0.25)",
        button: "0 4px 12px rgba(94, 126, 107, 0.25)",
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
