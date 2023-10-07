import type { Config } from "tailwindcss";

export default {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"],
  theme: {
    extend: {
      flexGrow: {
        2: "2",
      },
      gridTemplateColumns: {
        // Track name/solo/mute :: Measure box list
        "part-list": "max-content 1fr",

        // binding :: description
        "key-bindings": "7em auto",
      },
      keyframes: {
        bounce: {
          "0%, 100%": { transform: "translateY(-25%)" },
          "50%": { transform: "translateY(0)" },
        },
      },
      minWidth: {
        ex: "1.5em",
        screen: "100vw",
      },
      maxWidth: {
        screen: "100vw",
      },
      padding: {
        0.8: "3px",
      },
      fontSize: {
        "2xs": "0.6rem",
      },
      zIndex: {
        top: "1000000",
      },
    },
  },
  variants: {},
  plugins: [],
} satisfies Config;
