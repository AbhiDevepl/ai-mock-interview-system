import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA21BfcG1WD-zQ1hZDX0s-_mt9WBc00038",
  authDomain: "prepwise-4287m.firebaseapp.com",
  projectId: "prepwise-42878",
  storageBucket: "prepwise-4287a.firebasestorage.app",
  messagingSenderId: "718591458179",
  appId: "1:718591458179:web:8290057d79dcd3a761c8f6",
  measurementId: "G-RHTOBXOHRS",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const analytics =
  typeof window !== "undefined"
    ? isSupported().then((yes) => (yes ? getAnalytics(app) : null))
    : null;

export { app, analytics };
