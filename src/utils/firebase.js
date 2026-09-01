import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Vite environment variables with fallback defaults
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDkaXEX1UCe7JI6YGSwKSUwhlhicMWKduk',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fitgirls-me-web.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fitgirls-me-web',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fitgirls-me-web.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '997964786089',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:997964786089:web:72eaba535985f0c8a2fcb8'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
