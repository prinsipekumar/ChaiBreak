// Jest config for the Backend. Type errors do not fail tests here
// (diagnostics: false), same as `npm run dev` which uses --transpile-only.
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { diagnostics: false }],
  },
  testTimeout: 15000,
};
