import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

const parseEnv = (filePath) => {
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

const checkCategories = async () => {
    try {
        const ref = collection(db, "gallery");
        const snapshot = await getDocs(ref);
        const categories = new Set();
        const types = new Set();
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.mainCategory) categories.add(data.mainCategory);
            if (data.type) types.add(data.type);
        });
        
        console.log("Unique mainCategory values:", Array.from(categories));
        console.log("Unique type values:", Array.from(types));
        
        process.exit(0);
    } catch (error) {
        console.error("Check categories failed:", error);
        process.exit(1);
    }
};

checkCategories();
