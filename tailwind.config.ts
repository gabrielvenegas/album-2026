import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070b0d",
        surface: "#111719",
        border: "#20282c",
        owned: "#00d675",
        duplicate: "#ff7a2f",
        missing: "#3a4247",
        gold: "#ffb238",
        text: "#fff4d7",
        muted: "#7b828a",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
