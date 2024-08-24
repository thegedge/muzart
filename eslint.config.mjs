/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// @ts-check

import tseslint from "typescript-eslint";

// @ts-expect-error -- Could not find a declaration file for module
import eslint from "@eslint/js";
// @ts-expect-error -- Could not find a declaration file for module
import lodashPlugin from "eslint-plugin-lodash";
// @ts-expect-error -- Could not find a declaration file for module
import importPlugin from "eslint-plugin-import";
// @ts-expect-error -- Could not find a declaration file for module
import promisePlugin from "eslint-plugin-promise";
// @ts-expect-error -- Could not find a declaration file for module
import reactPlugin from "eslint-plugin-react";
// @ts-expect-error -- Could not find a declaration file for module
import prettierPlugin from "eslint-config-prettier";
// @ts-expect-error -- Could not find a declaration file for module
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: ["node_modules", "dist", "public"],
  },

  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.strictTypeChecked,

  {
    rules: {
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: true,
        },
      ],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/unified-signatures": [
        "error",
        {
          ignoreDifferentlyNamedParameters: true,
        },
      ],
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
    },
    languageOptions: {
      parserOptions: {
        project: "packages/*/tsconfig.json",
      },
    },
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,

      // tsc will deal with this for us
      "import/no-unresolved": "off",

      // TODO turn these back on once working with eslint 9
      "import/default": "off",
      "import/namespace": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
    },
  },
  {
    plugins: {
      lodash: lodashPlugin,
    },
    rules: {
      ...lodashPlugin.configs.recommended.rules,
      "lodash/import-scope": ["error", "member"],
      "lodash/prefer-constant": "off",
      "lodash/prefer-lodash-method": "off",
      "lodash/prefer-lodash-typecheck": "off",
      "lodash/prefer-matches": "off",
      "lodash/prefer-noop": "off",
      "lodash/prop-shorthand": "off",
    },
  },
  {
    plugins: {
      promise: promisePlugin,
    },
    rules: {
      ...promisePlugin.configs.recommended.rules,

      // TODO turn these back on once working with eslint 9
      "promise/no-promise-in-callback": "off",
      "promise/no-nesting": "off",
      "promise/no-return-wrap": "off",

      "promise/always-return": [
        "warn",
        {
          ignoreLastCallback: true,
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "18.2.0",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // TODO turn these back on once working with eslint 9
      "react/boolean-prop-naming": "off",
      "react/default-props-match-prop-types": "off",
      "react/destructuring-assignment": "off",
      "react/display-name": "off",
      "react/forbid-prop-types": "off",
      "react/function-component-definition": "off",
      "react/hook-use-state": "off",
      "react/jsx-fragments": "off",
      "react/jsx-max-depth": "off",
      "react/jsx-no-bind": "off",
      "react/jsx-no-constructed-context-values": "off",
      "react/jsx-no-undef": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "off",
      "react/no-access-state-in-setstate": "off",
      "react/no-array-index-key": "off",
      "react/no-arrow-function-lifecycle": "off",
      "react/no-danger-with-children": "off",
      "react/no-direct-mutation-state": "off",
      "react/no-multi-comp": "off",
      "react/no-set-state": "off",
      "react/no-string-refs": "off",
      "react/no-this-in-sfc": "off",
      "react/no-typos": "off",
      "react/no-unstable-nested-components": "off",
      "react/no-unused-prop-types": "off",
      "react/no-unused-state": "off",
      "react/no-object-type-as-default-prop": "off",
      "react/prefer-exact-props": "off",
      "react/prefer-read-only-props": "off",
      "react/prefer-stateless-function": "off",
      "react/prop-types": "off",
      "react/require-default-props": "off",
      "react/require-optimization": "off",
      "react/require-render-return": "off",
      "react/sort-comp": "off",
      "react/static-property-placement": "off",
      "react/style-prop-object": "off",

      "react/jsx-key": "error",
      "react/jsx-no-comment-textnodes": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-target-blank": "error",
      "react/no-children-prop": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-unescaped-entities": "error",
      "react/no-unsafe": "warn",

      "react/no-deprecated": "off",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
    },
  },

  {
    rules: prettierPlugin.rules,
  },
);
