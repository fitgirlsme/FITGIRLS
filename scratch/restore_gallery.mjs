import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// 가장 최근의 갤러리 백업 파일 경로
const backupFilePath = path.resolve(__dirname, '../backups/backup_2026-03-17T10-14-48-034Z/gallery.json');

async function restoreGallery() {
    if (!fs.existsSync(backupFilePath)) {
        console.error("Backup file not found at:", backupFilePath);
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(backupFilePath, 'utf-8');
        const items = JSON.parse(rawData);
        console.log(`Loaded ${items.length} items from backup.`);

        // Firestore batch size limit is 500
        const CHUNK_SIZE = 400; 
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            
            chunk.forEach(item => {
                const docId = item.id;
                // id 필드는 문서 ID로 쓰이므로 데이터 본문에서는 제외하거나 포함할 수 있음
                const docData = { ...item };
                delete docData.id;
                
                const docRef = doc(db, 'gallery', docId);
                batch.set(docRef, docData);
            });

            console.log(`Uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items)...`);
            await batch.commit();
            console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} uploaded successfully.`);
        }

        console.log("🎉 Gallery collection restoration completed successfully!");
    } catch (e) {
        console.error("Failed to restore gallery:", e);
    }
    process.exit(0);
}

restoreGallery();
