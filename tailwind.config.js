module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        // Track name | Soloed | Muted | Measure box list
        "part-list": "max-content minmax(1.5rem, max-content) minmax(1.5rem, max-content) 1fr",
      },
      flexGrow: {
        2: "2",
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
