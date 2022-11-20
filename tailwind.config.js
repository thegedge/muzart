module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
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
