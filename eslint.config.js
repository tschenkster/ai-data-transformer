import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unicorn": unicorn,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // File naming conventions
      "unicorn/filename-case": ["error", {
        "cases": {
          "kebabCase": true,
          "pascalCase": true
        },
        "ignore": [
          "App.tsx",
          "index.html"
        ]
      }],
      // Prevent barrel exports (R38)
      "no-restricted-syntax": [
        "error",
        {
          "selector": "ExportAllDeclaration[source.value=/^\\.\//]",
          "message": "Barrel exports (export * from './...') are not allowed. Use direct imports instead."
        }
      ],
      // Component size limits (R34)
      "max-lines-per-file": ["warn", { "max": 200, "skipBlankLines": true, "skipComments": true }],
      // Explicit return types (R43)
      "@typescript-eslint/explicit-module-boundary-types": ["warn"],
      // Import organization (R39)
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"]
      }],
      // No circular dependencies (R40)
      "import/no-cycle": ["error"],
    },
  }
);
