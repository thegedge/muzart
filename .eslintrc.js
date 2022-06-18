module.exports = {
  plugins: ["@typescript-eslint", "react-hooks", "lodash", "import"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["tsconfig.json"],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/typescript",
    "plugin:lodash/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/restrict-template-expressions": "off",
    "lodash/import-scope": ["error", "member"],
    "lodash/prefer-lodash-method": "off",
    "lodash/prefer-lodash-typecheck": "off",
  },
};
