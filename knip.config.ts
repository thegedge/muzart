import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["packages/editor/src/ui/index.tsx!", "*.{js,ts}!"],

  ignore: [
    "packages/editor/src/utils/suspenseful.ts",
    "packages/editor/src/utils/svg.ts",
    "packages/playback/src/nodes/node_helpers.ts",
    "packages/playback/src/util/gain.ts",
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
