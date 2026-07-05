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

if (isTesting || !serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.warn("Firebase Admin SDK running in test/mock mode or environment variables are missing.");
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  }
}

export { admin };
