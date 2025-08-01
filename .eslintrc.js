module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["typed-rocks"],
  rules: {
    "max-depth": ["error", 3], // ESLint's built-in rule,
    "typed-rocks/max-depth": ["error", 2],
  },
};
