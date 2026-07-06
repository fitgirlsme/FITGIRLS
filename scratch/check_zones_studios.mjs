import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkCollections() {
    const collections = ['studios', 'programs', 'home_sections', 'configs'];
    for (const name of collections) {
        try {
            const ref = collection(db, name);
            const snapshot = await getDocs(ref);
            console.log(`\n=== Collection "${name}": ${snapshot.size} documents ===`);
            snapshot.docs.forEach((doc, index) => {
                console.log(`[${index + 1}] ID: ${doc.id}`);
                console.log(JSON.stringify(doc.data(), null, 2).substring(0, 500) + '...');
            });
        } catch (e) {
            console.log(`Error checking "${name}": ${e.message}`);
        }
    }
    process.exit(0);
}

checkCollections();
