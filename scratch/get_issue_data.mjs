import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Parse .env manually
const envContent = fs.readFileSync('/Users/house/Pictures/fitgirlsme/.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getIssueData() {
    const docRef = doc(db, 'issues', 'ZGoUNNumzRk1pZ9ngiie');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        console.log("Issue Data for ZGoUNNumzRk1pZ9ngiie:");
        console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
        console.log("No document found with ID: ZGoUNNumzRk1pZ9ngiie");
    }
}

getIssueData().catch(console.error);
