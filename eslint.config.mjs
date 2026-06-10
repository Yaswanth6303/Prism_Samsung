import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  // ── Global ignores ────────────────────────────────────────────────────────
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "node_modules/**",
      "public/**",
      "coverage/**",
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },

  // ── Base JS recommended ───────────────────────────────────────────────────
  js.configs.recommended,

  // ── Next.js core web vitals (native flat config — no FlatCompat needed) ──
  nextPlugin.configs["core-web-vitals"],

  // ── TypeScript + React + Hooks + Import + a11y ───────────────────────────
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: { alwaysTryTypes: true, project: "./tsconfig.json" },
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
    rules: {
      // ── TypeScript ────────────────────────────────────────────────────────
      ...tsPlugin.configs["recommended"].rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"].rules,
      "@typescript-eslint/no-unused-vars": "off", // handled by unused-imports
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],

      // ── React ─────────────────────────────────────────────────────────────
      "react/react-in-jsx-scope": "off", // Not needed in Next.js (React 17+)
      "react/prop-types": "off", // TypeScript handles this
      "react/jsx-no-target-blank": ["error", { enforceDynamicLinks: "always" }],
      "react/no-danger": "error",
      "react/no-array-index-key": "warn",
      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" },
      ],
      "react/self-closing-comp": ["warn", { component: true, html: true }],
      "react/jsx-boolean-value": ["warn", "never"],
      "react/no-unescaped-entities": "error",
      "react/display-name": "warn",

      // ── React Hooks ───────────────────────────────────────────────────────
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // ── Imports ───────────────────────────────────────────────────────────
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "type",
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "next/**",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["react", "next"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/no-self-import": "error",

      // ── Accessibility ─────────────────────────────────────────────────────
      ...jsxA11yPlugin.configs.recommended.rules,
      "jsx-a11y/anchor-is-valid": [
        "error",
        {
          components: ["Link"],
          specialLink: ["hrefLeft", "hrefRight"],
          aspects: ["invalidHref", "preferButton"],
        },
      ],

      // ── General JS / Best Practices ───────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "all"],
      "object-shorthand": "warn",
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "warn",
      "no-return-await": "error",
      "no-throw-literal": "error",
      "no-param-reassign": [
        "error",
        { props: true, ignorePropertyModificationsFor: ["state"] },
      ],
      "spaced-comment": ["warn", "always", { markers: ["/"] }],
    },
  },

  // ── Relax rules inside test files ─────────────────────────────────────────
  {
    files: [
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/__tests__/**",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // ── Server-side files: allow console.log ──────────────────────────────────
  {
    files: ["app/api/**", "lib/server/**", "server/**", "scripts/**"],
    rules: {
      "no-console": "off",
    },
  },

  // ── TypeScript files: TS compiler handles undef-checking (official typescript-eslint recommendation) ──
  // Base no-undef misfires on namespace types like React.ChangeEvent that TS resolves correctly.
  // Plain .js/.mjs/.cjs config files keep the rule active.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
    },
  },

  // ── shadcn-generated UI primitives ────────────────────────────────────────
  // Files under components/ui/* are produced by `npx shadcn add` and get re-written on every update.
  // Hand-edits get clobbered, so we lighten the rules that misfire on shadcn's intentional patterns
  // (chart's CSS-injection via dangerouslySetInnerHTML, sidebar's mutable tooltip arg, etc.).
  // All semantic checks (floating promises, misused promises) stay on.
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "react/no-danger": "off",
      "no-param-reassign": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "jsx-a11y/anchor-has-content": "off",
      "jsx-a11y/heading-has-content": "off",
      eqeqeq: "off",
    },
  },
];

export default config;
