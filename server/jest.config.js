process.env.FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || "test-project";
process.env.FIREBASE_CLIENT_EMAIL =
  process.env.FIREBASE_CLIENT_EMAIL || "test@test.iam.gserviceaccount.com";
// NEVER hardcode a real private key — use a clearly invalid test placeholder
process.env.FIREBASE_PRIVATE_KEY =
  process.env.FIREBASE_PRIVATE_KEY ||
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTEST\nTHIS_IS_A_FAKE_KEY_FOR_TESTING_ONLY\nDO_NOT_USE_IN_PRODUCTION\n-----END PRIVATE KEY-----";

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
