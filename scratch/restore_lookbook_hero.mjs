import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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

const lookbookPath = '/Users/house/Pictures/inastudio/backups/lookbook_backup_2026-06-05T02-55-50-438Z.json';
const heroPath = '/Users/house/Pictures/inastudio/backups/hero_slides_backup_2026-06-05T02-55-50-630Z.json';

async function restoreCollection(filePath, collectionName) {
    if (!fs.existsSync(filePath)) {
        console.error(`Backup file not found at: ${filePath}`);
        return;
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const items = JSON.parse(rawData);
        console.log(`Loaded ${items.length} items for [${collectionName}] from 6/5 backup.`);

        const CHUNK_SIZE = 400; 
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            
            chunk.forEach(item => {
                const docId = item.id;
                const docData = { ...item.data };
                
                // Timestamp 파싱
                if (docData.createdAt && typeof docData.createdAt === 'object' && 'seconds' in docData.createdAt) {
                    docData.createdAt = new Date(docData.createdAt.seconds * 1000 + Math.floor(docData.createdAt.nanoseconds / 1000000));
                }

                const docRef = doc(db, collectionName, docId);
                batch.set(docRef, docData);
            });

            console.log(`Uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1} to [${collectionName}] (${chunk.length} items)...`);
            await batch.commit();
            console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} for [${collectionName}] uploaded.`);
        }

        console.log(`🎉 [${collectionName}] fully restored!`);
    } catch (e) {
        console.error(`Failed to restore [${collectionName}]:`, e);
    }
}

async function startRestore() {
    await restoreCollection(lookbookPath, 'lookbook');
    await restoreCollection(heroPath, 'hero_slides');
    process.exit(0);
}

startRestore();
