import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query, orderBy } from 'firebase/firestore';

// 1. .env 파싱 유틸
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

async function checkRecentChecklists() {
    console.log('Fetching recent checklists from Firestore...');
    try {
        const colRef = collection(db, 'fitorialist_checklists');
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('No documents found in fitorialist_checklists.');
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`- Document ID: [${doc.id}]`);
            console.log(`  Name: ${data.name}`);
            console.log(`  Phone: ${data.phone}`);
            console.log(`  Date: ${data.date}`);
            console.log(`  Concept: ${data.concept}`);
            console.log(`  CreatedAt: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
            console.log('------------------------------------------------');
        });
    } catch (err) {
        console.error('Error fetching checklists:', err);
    }
}

checkRecentChecklists();
