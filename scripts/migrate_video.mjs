import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

async function migrateVideos() {
    const docRef = doc(db, 'configs', 'magazine');
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            let videoUrls = data.videoUrls || {};
            
            let fitoVideos = videoUrls.fitorialist || [];
            let fashionVideos = videoUrls.fashion || [];
            
            // Normalize to array
            if (typeof fitoVideos === 'string') fitoVideos = [fitoVideos];
            if (typeof fashionVideos === 'string') fashionVideos = [fashionVideos];
            if (!Array.isArray(fitoVideos)) fitoVideos = [];
            if (!Array.isArray(fashionVideos)) fashionVideos = [];
            
            // Legacy fallback
            if (data.videoUrl && fitoVideos.length === 0) {
                fitoVideos = [data.videoUrl];
            }
            
            // Filter out empty strings
            const validFito = fitoVideos.filter(v => typeof v === 'string' && v.trim() !== '');
            const validFashion = fashionVideos.filter(v => typeof v === 'string' && v.trim() !== '');
            
            if (validFito.length > 0) {
                // Move fitorialist videos to fashion
                const newFashion = [...validFashion, ...validFito];
                videoUrls = {
                    ...videoUrls,
                    fashion: newFashion,
                    fitorialist: [''] // Reset fitorialist
                };
                
                await updateDoc(docRef, { videoUrls });
                console.log(`Successfully migrated ${validFito.length} video(s) from FITORIALIST to FASHION & BEAUTY.`);
            } else {
                console.log("No valid videos found in FITORIALIST category to migrate.");
            }
        } else {
            console.log("Config document does not exist.");
        }
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrateVideos();
