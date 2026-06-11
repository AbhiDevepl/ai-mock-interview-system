import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.warn("Firebase Admin SDK environment variables are missing. Some authentication features may not work correctly.");
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  }
}

export { admin };
