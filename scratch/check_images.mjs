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

async function testUrl(url) {
    if (!url) return 'No URL';
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return `${res.status} ${res.statusText}`;
    } catch (e) {
        return `Error: ${e.message}`;
    }
}

async function checkImages() {
    try {
        const ref = collection(db, 'models');
        const snapshot = await getDocs(ref);
        console.log(`Total models: ${snapshot.size}`);
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`\nModel: ${data.nameEn} (${data.nameKr})`);
            
            const mainImgUrl = data.mainImage || data.imageUrl;
            const mainStatus = await testUrl(mainImgUrl);
            console.log(`  MainImage Status: ${mainStatus}`);
            console.log(`  MainImage URL: ${mainImgUrl}`);
            
            if (data.portfolio && data.portfolio.length > 0) {
                console.log(`  Portfolio Images (${data.portfolio.length}):`);
                for (let i = 0; i < data.portfolio.length; i++) {
                    const img = data.portfolio[i];
                    const url = img.url || img;
                    const status = await testUrl(url);
                    console.log(`    [${i+1}] ${status} - ${url.substring(0, 80)}...`);
                }
            } else {
                console.log(`  Portfolio Images: None`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

checkImages();
