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

async function aggregateTags() {
    console.log('Fetching all gallery documents to extract tags...');
    try {
        const colRef = collection(db, 'gallery');
        const snap = await getDocs(colRef);
        console.log(`Total documents analyzed: ${snap.size}`);

        const tagCounts = {};
        let taggedDocsCount = 0;

        snap.forEach(d => {
            const data = d.data();
            if (data.aiTags && Array.isArray(data.aiTags)) {
                if (data.aiTags.length > 0) taggedDocsCount++;
                data.aiTags.forEach(tag => {
                    const cleanTag = String(tag).trim();
                    if (cleanTag) {
                        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                    }
                });
            }
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1]);

        console.log(`Tagged Documents Count: ${taggedDocsCount}/${snap.size}`);
        console.log(`Unique AI Tags Found: ${sortedTags.length}`);
        
        console.log('\n=== TOP 60 AI TAGS BY FREQUENCY ===');
        sortedTags.slice(0, 60).forEach(([tag, count], idx) => {
            console.log(`${idx + 1}. [${tag}]: ${count} times`);
        });
        console.log('===================================\n');

    } catch (err) {
        console.error('Error:', err);
    }
}

aggregateTags();
