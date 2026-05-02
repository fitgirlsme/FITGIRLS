import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDkaXEX1UCe7JI6YGSwKSUwhlhicMWKduk",
    authDomain: "fitgirls-me-web.firebaseapp.com",
    projectId: "fitgirls-me-web",
    storageBucket: "fitgirls-me-web.firebasestorage.app",
    messagingSenderId: "997964786089",
    appId: "1:997964786089:web:72eaba535985f0c8a2fcb8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAccount() {
    const phoneId = '01046961441';
    try {
        const ref = doc(db, 'retouch_masters', phoneId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
            console.log('ACCOUNT_FOUND:', JSON.stringify(snapshot.data()));
        } else {
            console.log('ACCOUNT_NOT_FOUND');
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    }
    process.exit(0);
}

checkAccount();
