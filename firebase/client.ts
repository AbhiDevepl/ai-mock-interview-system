import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOCUK6hc700qslaNwhM-WubriBrtKR1ZI",
  authDomain: "perpwise-ai.firebaseapp.com",
  projectId: "perpwise-ai",
  storageBucket: "perpwise-ai.firebasestorage.app",
  messagingSenderId: "372289297754",
  appId: "1:372289297754:web:251a3edecf1921bc016763",
  measurementId: "G-2P44EP9X3S",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
