module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        "part-list": "max-content 1fr",
      },
      minWidth: {
        screen: "100vw",
      },
      maxWidth: {
        screen: "100vw",
      },
      keyframes: {
        bounce: {
          "0%, 100%": { transform: "translateY(-25%)" },
          "50%": { transform: "translateY(0)" },
        },
      },
    },
  },
  variants: {},
  plugins: [],
};
