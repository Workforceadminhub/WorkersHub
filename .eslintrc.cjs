module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      project: "./tsconfig.json",
    },
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
    plugins: ["@typescript-eslint", "prettier", "tailwindcss"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:tailwindcss/recommended",
      "plugin:prettier/recommended"
    ],
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "tailwindcss/no-custom-classname": "off"
    }
  };
  