/** @typedef { import('tailwindcss/defaultConfig') } DefaultConfig */
/** @typedef { import('tailwindcss/defaultTheme') } DefaultTheme */

/** @type { DefaultConfig & { theme: { extend: DefaultTheme } } } */
module.exports = {
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
      },
      keyframes: {
        bounce: {
          "0%, 100%": { transform: "translateY(-25%)" },
          "50%": { transform: "translateY(0)" },
        },
      },
      minWidth: {
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
    },
  },
  variants: {},
  plugins: [],
};
