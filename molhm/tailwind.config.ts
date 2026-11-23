import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#07122B", 900: "#0B1B3A", 800: "#13294F", 700: "#1D3A6B", 100: "#E6EBF4" },
        ivory: { DEFAULT: "#FAF7F0", 200: "#F1ECDF" },
        gold: { DEFAULT: "#B8975A", dark: "#8F7240", light: "#E3D3AE" },
      },
      fontFamily: { sans: ["'IBM Plex Sans Arabic'", "Tajawal", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 10px 30px -12px rgba(11,27,58,.25)" },
    },
  },
  plugins: [],
} satisfies Config;
