import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4"],
  theme: {
    extend: {
      backdropBlur: {
        "2xs": "1px",
        "xs": "2px",
      },
      boxShadow: {
        modal: "0 0 50px 0 rgba(0, 0, 0, 0.5)",
      },
      flexGrow: {
        2: "2",
      },
      fontSize: {
        "2xs": "0.6rem",
      },
      gridTemplateColumns: {
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
      maxHeight: {
        screen: "100vh",
      },
      maxWidth: {
        screen: "100vw",
      },
      padding: {
        "0.8": "0.2rem",
        "1.2": "0.3rem",
      },
      textShadow: {
        DEFAULT: "0.5px 0.5px 0 var(--tw-shadow-color)",
        sm: "1px 1px 1px var(--tw-shadow-color)",
        md: "1px 1px 2px var(--tw-shadow-color)",
        lg: "1px 1px 16px var(--tw-shadow-color)",
      },
      zIndex: {
        top: "1000000",
      },
    },
  },
  variants: {},
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") },
      );
    }),
  ],
} satisfies Config;
