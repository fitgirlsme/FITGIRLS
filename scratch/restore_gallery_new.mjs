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

// 6월 5일 2.1MB 갤러리 백업 파일 경로
const backupFilePath = '/Users/house/Pictures/inastudio/backups/gallery_backup_2026-06-05T02-53-57-543Z.json';

async function restoreGallery() {
    if (!fs.existsSync(backupFilePath)) {
        console.error("Backup file not found at:", backupFilePath);
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(backupFilePath, 'utf-8');
        const items = JSON.parse(rawData);
        console.log(`Loaded ${items.length} items from 6/5 backup.`);

        // Firestore batch size limit is 500
        const CHUNK_SIZE = 400; 
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            const chunk = items.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            
            chunk.forEach(item => {
                const docId = item.id;
                // data 필드 아래의 실제 Firestore 문서 데이터를 추출
                const docData = { ...item.data };
                
                // Firestore Timestamp 호환 처리:
                // 만약 createdAt에 seconds와 nanoseconds가 객체 형태로 백업되어 있다면,
                // 이를 Firestore Timestamp 데이터 혹은 Date 객체, 혹은 숫자 등으로 정규화할 수 있습니다.
                // Firebase Web SDK v9+ 에서는 Timestamp 객체 형식으로 { seconds, nanoseconds }를 
                // 바로 set해도 되지만, 클라이언트에서 parsing 시 에러가 안 나도록 seconds를 파싱하거나 그냥 넘길 수 있습니다.
                if (docData.createdAt && typeof docData.createdAt === 'object' && 'seconds' in docData.createdAt) {
                    // JSON 백업은 Firebase의 Timestamp 형식을 단순 오브젝트로 직렬화했을 것이므로,
                    // SDK가 알아볼 수 있도록 Date 객체로 변환하여 저장하거나, 
                    // 혹은 { seconds, nanoseconds } 형태 그대로 저장(Firestore가 Timestamp로 해석함)합니다.
                    // 안전을 위해 Date 객체로 파싱해서 넘기거나 Timestamp 포맷을 명시화합니다.
                    docData.createdAt = new Date(docData.createdAt.seconds * 1000 + Math.floor(docData.createdAt.nanoseconds / 1000000));
                }

                const docRef = doc(db, 'gallery', docId);
                batch.set(docRef, docData);
            });

            console.log(`Uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} items)...`);
            await batch.commit();
            console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} uploaded successfully.`);
        }

        console.log("🎉 Gallery collection fully restored with 3,000+ items!");
    } catch (e) {
        console.error("Failed to restore gallery:", e);
    }
    process.exit(0);
}

restoreGallery();
