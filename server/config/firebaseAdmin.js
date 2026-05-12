import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let app;

if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to default credentials if env var is not set (e.g. in dev environment)
      app = admin.initializeApp();
    }
    console.log("Firebase Admin initialized");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
} else {
  app = admin.app();
}

export const auth = admin.auth(app);
export default admin;
