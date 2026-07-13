import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// .env 파싱 유틸
function loadEnv() {
    const envPath = './.env';
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found.');
        process.exit(1);
    }
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

async function testFetch() {
    console.log('1. Firestore에서 갤러리 이미지 데이터 로드 중...');
    const galleryCol = collection(db, 'gallery');
    const snapshot = await getDocs(galleryCol);
    const allDocs = [];
    snapshot.forEach(d => {
        allDocs.push({ id: d.id, ...d.data() });
    });

    console.log(`- 전체 개수: ${allDocs.length}개`);
    
    // 비어있는 데이터나 비정상 데이터가 있는지 확인
    let brokenDocs = 0;
    allDocs.forEach((d, idx) => {
        try {
            // 우리가 Gallery.jsx loadItems에서 매핑하는 로직 그대로 적용해 테스트
            let ts = d.order || 0;
            if (d.createdAt) {
                if (d.createdAt.toMillis) ts = d.createdAt.toMillis();
                else if (d.createdAt.seconds) ts = d.createdAt.seconds * 1000;
                else if (typeof d.createdAt === 'number') ts = d.createdAt;
                else if (typeof d.createdAt === 'string') ts = new Date(d.createdAt).getTime();
            }
            
            let mainCat = (d.mainCategory || 'fitorialist').toLowerCase();
            let subCat = (d.type || 'women').toLowerCase();
            
            let targetAiTags = [];
            let translations = d.translations || { en: [], ja: [], zh: [] };
            
            // 임의의 translations 타입 테스트
            if (translations && typeof translations === 'object') {
                targetAiTags = translations['en'] || [];
            }
        } catch (e) {
            brokenDocs++;
            console.error(`❌ 에러 유발 문서 발견! ID: ${d.id}, 파일명: ${d.name}`);
            console.error(e);
        }
    });

    console.log(`- 테스트 결과: 에러 유발 문서 수 = ${brokenDocs}개`);
}

testFetch().catch(console.error);
