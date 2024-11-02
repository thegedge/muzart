import type { Config } from "tailwindcss";

export default {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [],
} satisfies Config;
