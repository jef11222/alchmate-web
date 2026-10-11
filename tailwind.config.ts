import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        osrs: {
          dark: "#0f1115",
          darker: "#0a0c0e",
          card: "#161920",
          border: "#262b36",
          gold: "#f5a623",
          green: "#00c853",
          red: "#ff5252",
          yellow: "#ffd600",
          blue: "#2979ff",
          text: "#e0e6ed",
          muted: "#8c9ba5"
        }
      }
    },
  },
  plugins: [],
};
export default config;
