/** @type {import('jest').Config} */
export default {
  transform: {},
  testEnvironment: "node",
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globals: {},
};
