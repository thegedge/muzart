import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/editor/ui/index.tsx!", "*.{js,ts}!"],

  ignore: [
    "src/editor/utils/suspenseful.ts",
    "src/editor/utils/svg.ts",
    "src/playback/nodes/node_helpers.ts",
    "src/playback/util/gain.ts",
  ],

  ignoreDependencies: [
    "@types/audioworklet",
    "css-loader",
    "postcss-loader",
    "postcss-nesting",
    "postcss-preset-env",
    "react",
    "react-dom",
    "style-loader",
  ],

  rules: {
    types: "off",
    enumMembers: "off",
  },
};

export default config;
