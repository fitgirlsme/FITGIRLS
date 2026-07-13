import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

function loadEnv() {
    const envPath = './.env';
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const config = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            config[match[1]] = value;
        }
    });
    return config;
}

const env = loadEnv();

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findFailed() {
    console.log('Fetching all gallery items to find failed ones...');
    try {
        const colRef = collection(db, 'gallery');
        const snap = await getDocs(colRef);
        console.log(`Total documents: ${snap.size}`);

        const failed = [];
        snap.forEach(d => {
            const data = d.data();
            const hasAiTags = data.aiTags && data.aiTags.length > 0;
            const hasEmbedding = data.imageEmbedding && data.imageEmbedding.length > 0;
            const hasTranslations = data.translations && data.translations.en && data.translations.en.length > 0;

            if (!hasAiTags || !hasEmbedding || !hasTranslations) {
                failed.push({
                    id: d.id,
                    name: data.name || 'No Name',
                    imageUrl: data.imageUrl || data.img || data.url || 'No URL',
                    hasAiTags,
                    hasEmbedding,
                    hasTranslations
                });
            }
        });

        console.log(`Failed items count: ${failed.length}`);
        failed.forEach((item, idx) => {
            console.log(`[${idx + 1}] ID: ${item.id} | Name: ${item.name}`);
            console.log(`    URL: ${item.imageUrl}`);
            console.log(`    Status: aiTags(${item.hasAiTags}), Embedding(${item.hasEmbedding}), Translations(${item.hasTranslations})`);
        });

    } catch (err) {
        console.error('Error:', err);
    }
}

findFailed();
