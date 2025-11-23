module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "linebreak-style": "off",
    "require-jsdoc": "off",
    "brace-style": "off",
    "object-curly-spacing": "off",
    "prefer-const": "off",
    "max-len": "off",
    "block-spacing": "off",
    "arrow-parens": "off",
    "one-var": "off",
    "eol-last": "off",
    "camelcase": "off",
    "indent": "off",
    "comma-dangle": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
