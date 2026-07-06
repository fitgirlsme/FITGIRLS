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

async function checkSubcategories() {
    try {
        const snap = await getDocs(collection(db, 'studios'));
        const subCategories = new Set();
        snap.docs.forEach(doc => {
            const data = doc.data();
            if (data.subCategory) {
                subCategories.add(data.subCategory);
            }
        });
        console.log("Unique subCategories in 'studios' DB:", Array.from(subCategories));
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

checkSubcategories();
