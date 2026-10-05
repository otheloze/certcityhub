/** Unit tests only (no DB) - see test/jest-e2e.json for e2e config. */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  moduleNameMapper: {
    "^@examproject/shared-types$": "<rootDir>/../../../packages/shared-types/src/index.ts",
  },
  testEnvironment: "node",
};
