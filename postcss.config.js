import autoprefixer from "autoprefixer";
import nesting from "postcss-nesting";
import tailwindcss from "tailwindcss";

export default {
  plugins: [nesting, tailwindcss, autoprefixer],
};
