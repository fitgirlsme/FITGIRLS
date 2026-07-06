import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import fs from 'fs';

// Manually parse .env
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

async function main() {
    console.log("Fetching coupon_claims...");
    const claimsSnap = await getDocs(query(collection(db, 'coupon_claims'), orderBy('claimedAt', 'desc'), limit(5)));
    claimsSnap.forEach(doc => {
        console.log("Claim ID:", doc.id, doc.data());
    });

    console.log("Fetching coupon_events...");
    const eventsSnap = await getDocs(collection(db, 'coupon_events'));
    eventsSnap.forEach(doc => {
        console.log("Event ID:", doc.id, doc.data());
    });
}

main().catch(console.error);
