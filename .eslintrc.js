module.exports = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "tsconfigRootDir": __dirname,
    "project": ["./tsconfig.json"],
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "react-app",
    "react-app/jest",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  "rules": {
    "@typescript-eslint/ban-ts-comment": [
      "warn",
      {"ts-ignore": "allow-with-description",},
    ],
  },
}
