import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key needs to have its escaped newlines replaced with actual newlines
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
  console.warn("Firebase Admin SDK environment variables are missing. Some authentication features may not work correctly.");
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  }
}

export default admin;
