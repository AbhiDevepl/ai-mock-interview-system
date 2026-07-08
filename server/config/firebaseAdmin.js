import admin from "firebase-admin";
import dotenv from "dotenv";

// ponytail: load environment variables, but avoid overriding test-specific settings
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

const isTesting = process.env.NODE_ENV === "test";

if (isTesting) {
  console.warn("Firebase Admin SDK running in test/mock mode.");
} else if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  if (process.env.NODE_ENV === "production") {
    // ponytail: hard-fail at module load so the process exits before accepting traffic
    throw new Error("CRITICAL: Firebase Admin SDK credentials missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  }
  console.warn("Firebase Admin SDK credentials missing — running without Firebase (dev mode only).");
} else {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (err) {
      // ponytail: real creds required in prod; in dev a bad/placeholder key falls back to no-Firebase mode
      if (process.env.NODE_ENV === "production") throw err;
      console.warn(`Firebase Admin SDK init failed (${err.message}) — running without Firebase (dev mode only).`);
    }
  }
}

export { admin };
