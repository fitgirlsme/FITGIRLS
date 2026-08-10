import fetch from 'node-fetch';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(workspaceRoot, '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function optimizeCollection(collectionName) {
    console.log(`\n--- Optimizing images in collection: ${collectionName} ---`);
    const snap = await getDocs(collection(db, collectionName));
    
    let successCount = 0;
    
    for (const d of snap.docs) {
        const data = d.data();
        const imgUrl = data.img || data.image || data.imageUrl;
        const storagePath = data.storagePath;

        if (!imgUrl || !storagePath) {
            continue;
        }

        if (data.thumbUrl || imgUrl.includes('_optimized_')) {
            console.log(`Skipping ${d.id}: Already optimized (thumbUrl exists)`);
            continue;
        }

        console.log(`Optimizing ${d.id} (${collectionName})...`);
        try {
            const response = await fetch(imgUrl);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            
            const buffer = await response.arrayBuffer();
            
            const optimizedBuffer = await sharp(Buffer.from(buffer))
                .resize({ width: 800, withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer();
                
            const pathParts = storagePath.split('/');
            const fileName = pathParts.pop();
            const folder = pathParts.join('/');
            
            const newFileName = `_optimized_${fileName}`;
            const newStoragePath = `${folder}/${newFileName}`;
            const fileRef = ref(storage, newStoragePath);
            
            await uploadBytes(fileRef, optimizedBuffer, {
                contentType: 'image/jpeg'
            });
            
            const newUrl = await getDownloadURL(fileRef);
            
            // 썸네일 URL 필드 추가
            await updateDoc(doc(db, collectionName, d.id), {
                thumbUrl: newUrl
            });
            
            successCount++;
            console.log(`✅ Success: ${d.id} (Size reduced from ${(buffer.byteLength/1024).toFixed(1)}KB to ${(optimizedBuffer.length/1024).toFixed(1)}KB)`);
        } catch (e) {
            console.error(`❌ Failed to optimize ${d.id}:`, e.message);
        }
    }
    console.log(`Completed ${collectionName}. Optimized ${successCount} items.`);
}

async function run() {
    await optimizeCollection('lookbook');
    await optimizeCollection('studios');
    console.log('\nAll done!');
    process.exit(0);
}

run();
