module.exports = {
  mode: "jit",
  content: ["./src/**/*.html", "./src/**/*.ts", "./src/**/*.tsx"],
  theme: {
    extend: {
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
