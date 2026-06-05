import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAAjT-fGJUWm_qgybrfK7Znqms4-aDaRVA",
  authDomain: "kartly-498510.firebaseapp.com",
  projectId: "kartly-498510",
  storageBucket: "kartly-498510.firebasestorage.app",
  messagingSenderId: "756754296058",
  appId: "1:756754296058:web:5470f2d80d037125bd2d43",
  measurementId: "G-5CYLDY5WVY"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally
export const analytics = typeof window !== "undefined"
  ? isSupported().then(supported => supported ? getAnalytics(app) : null).catch(() => null)
  : null;
