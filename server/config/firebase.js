import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
  console.log("Firebase Admin initialized successfully");
} else {
  console.warn("Firebase Admin credentials missing. ID token verification will fail.");
}

export default admin;
