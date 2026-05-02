import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function fixPasswords() {
    try {
        const snapshot = await getDocs(collection(db, 'retouch_masters'));
        console.log(`Found ${snapshot.size} customers. Checking for missing passwords...`);
        
        let fixedCount = 0;
        for (const d of snapshot.docs) {
            const data = d.data();
            if (!data.password) {
                const phoneId = d.id;
                const newPass = phoneId.slice(-4);
                await updateDoc(doc(db, 'retouch_masters', phoneId), { password: newPass });
                console.log(`Fixed password for ${data.name} (${phoneId}) -> ${newPass}`);
                fixedCount++;
            }
        }
        console.log(`Finished. Fixed ${fixedCount} accounts.`);
    } catch (e) {
        console.log('ERROR:', e.message);
    }
    process.exit(0);
}

fixPasswords();
