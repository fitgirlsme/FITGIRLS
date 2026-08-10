import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

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

async function checkSizes() {
    try {
        const ref = collection(db, 'gallery');
        const q = query(ref, limit(20)); // Check 20 random/latest photos
        const snapshot = await getDocs(q);
        let totalSize = 0;
        let count = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const url = data.imageUrl || data.img || data.thumbUrl || data.url;
            if (url) {
                try {
                    const res = await fetch(url, { method: 'HEAD' });
                    const length = res.headers.get('content-length');
                    if (length) {
                        totalSize += parseInt(length, 10);
                        count++;
                    }
                } catch (e) {
                    console.log(`Failed to fetch head for ${url}: ${e.message}`);
                }
            }
        }
        
        console.log(`Checked ${count} images.`);
        console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        if (count > 0) {
            console.log(`Average Size: ${(totalSize / count / 1024).toFixed(2)} KB`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSizes();
