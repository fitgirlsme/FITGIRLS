import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

const parseEnv = (filePath) => {
    if (!fs.existsSync(filePath)) {
        console.error(".env file not found at", filePath);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const config = {};
    content.split("\n").forEach(line => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            config[key.trim()] = valueParts.join("=").trim();
        }
    });
    return config;
};

const env = parseEnv(envPath);

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

const COLLECTIONS_TO_BACKUP = [
    'hero_slides',
    'gallery',
    'lookbook',
    'events',
    'notices',
    'reviews',
    'faq'
];

const backupFirestore = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, `../backups/backup_${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`🚀 Starting backup to: ${backupDir}`);

    for (const colName of COLLECTIONS_TO_BACKUP) {
        try {
            console.log(`--- Backing up [${colName}] ---`);
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const filePath = path.join(backupDir, `${colName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ [${colName}] saved: ${data.length} items`);
        } catch (error) {
            console.error(`❌ Failed to backup [${colName}]:`, error.message);
        }
    }

    console.log("\n✨ Backup complete! All Firestore data is safely stored in the 'backups' folder.");
    process.exit(0);
};

backupFirestore();
