import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import https from 'https';

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

// Use a custom https agent to allow keeping connections alive
const agent = new https.Agent({ keepAlive: true, maxSockets: 50 });

async function getFileSize(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'HEAD', agent }, (res) => {
            const length = res.headers['content-length'];
            resolve(length ? parseInt(length, 10) : 0);
        });
        req.on('error', () => resolve(0));
        req.end();
    });
}

async function run() {
    try {
        console.log("Fetching gallery documents...");
        const ref = collection(db, 'gallery');
        const snapshot = await getDocs(query(ref));
        
        let urls = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const url = data.imageUrl || data.img || data.thumbUrl || data.url;
            if (url && url.startsWith('https://')) {
                urls.push(url);
            }
        }
        
        console.log(`Found ${urls.length} images. Checking sizes...`);
        
        let maxSize = 0;
        let maxUrl = "";
        
        // Process in batches
        const batchSize = 50;
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const sizes = await Promise.all(batch.map(url => getFileSize(url)));
            
            for (let j = 0; j < sizes.length; j++) {
                if (sizes[j] > maxSize) {
                    maxSize = sizes[j];
                    maxUrl = batch[j];
                }
            }
            if ((i + batchSize) % 500 === 0) {
                console.log(`Checked ${Math.min(i + batchSize, urls.length)} images... Current Max: ${(maxSize / 1024 / 1024).toFixed(2)} MB`);
            }
        }
        
        console.log('\n=== RESULTS ===');
        console.log(`Max Size: ${(maxSize / 1024 / 1024).toFixed(2)} MB (${(maxSize / 1024).toFixed(2)} KB)`);
        console.log(`URL: ${maxUrl}`);
        
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
