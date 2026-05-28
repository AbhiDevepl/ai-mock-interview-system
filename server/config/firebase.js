import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Ensure private key handles escaped newlines correctly
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
  console.warn('Firebase Admin credentials missing. Auth verification will fail.');
} else {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
    console.log('Firebase Admin initialized');
  }
}

export default admin;
