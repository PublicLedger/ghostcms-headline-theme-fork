const js = require("@eslint/js");
const jsdoc = require("eslint-plugin-jsdoc");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  jsdoc.configs["flat/recommended"],
  {
    files: ["**/*.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // Ghost shared-theme-assets globals
        pagination: "readonly",
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      // JSDoc validation - Start with warnings, not errors
      "jsdoc/require-jsdoc": "off", // Don't require JSDoc everywhere yet
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-returns-type": "warn",
      "jsdoc/check-types": "warn",
      "jsdoc/valid-types": "warn",
      "jsdoc/no-undefined-types": "off", // Browser types are defined globally

      // General code quality
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off", // Allow console in Ghost theme context
      "no-useless-assignment": "off", // Allow assignments for side effects/debugging
    },
  },
  {
    ignores: ["node_modules/**", "assets/built/**", "dist/**", "**/*.min.js"],
  },
];
