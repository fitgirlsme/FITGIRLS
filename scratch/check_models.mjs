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

async function checkModels() {
    try {
        const ref = collection(db, 'models');
        const snapshot = await getDocs(ref);
        console.log(`Total models: ${snapshot.size}`);
        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n--- Model ${index + 1} (${doc.id}) ---`);
            console.log(`Name: ${data.nameEn} (${data.nameKr})`);
            console.log(`Batch: ${data.batch}`);
            console.log(`Category: ${data.category}`);
            console.log(`createdAt: ${data.createdAt}`);
            console.log(`MainImage: ${data.mainImage || data.imageUrl ? 'Yes' : 'No'}`);
            console.log(`Fields:`, Object.keys(data));
            console.log(`Portfolio count: ${data.portfolio ? data.portfolio.length : 0}`);
            if (data.portfolio) {
                console.log(`Portfolio samples:`, data.portfolio.slice(0, 2));
            }
        });
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

checkModels();
