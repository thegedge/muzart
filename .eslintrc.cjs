module.exports = {
  plugins: ["@typescript-eslint", "react", "lodash", "import", "promise"],
  parserOptions: {
    tsconfigRootDir: ".",
    project: ["tsconfig.json"],
  },
  settings: {
    react: {
      version: "18.2.0",
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/typescript",
    "plugin:lodash/recommended",
    "plugin:promise/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
      },
    ],
    "lodash/import-scope": ["error", "member"],
    "lodash/prefer-constant": "off",
    "lodash/prefer-lodash-method": "off",
    "lodash/prefer-lodash-typecheck": "off",
    "lodash/prefer-matches": "off",
    "lodash/prefer-noop": "off",
    "lodash/prop-shorthand": "off",
    "promise/always-return": [
      "warn",
      {
        ignoreLastCallback: true,
      },
    ],
    "react/no-deprecated": "off",
    "react/no-unknown-property": "off",
    "react/react-in-jsx-scope": "off",
  },
};
