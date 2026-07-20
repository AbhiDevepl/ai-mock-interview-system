/**
 * InterviewIQ_AI — Centralized Frontend Configuration
 * Single source of truth for all environment variables.
 * Everything must be prefixed with VITE_ to be exposed to client code.
 */
const config = {
  serverUrl:
    (import.meta.env.VITE_SERVER_URL).replace(
      /\/+$/,
      "",
    ),

  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },

  auth: {
    cookieName: "token",
    cookieDomain: import.meta.env.VITE_COOKIE_DOMAIN || undefined,
  },

  app: {
    name: "InterviewIQ_AI",
    defaultCredits: 100,
  },
};

export const {
  serverUrl,
  firebase: firebaseConfig,
  auth: authConfig,
  app: appConfig,
} = config;
export default config;
