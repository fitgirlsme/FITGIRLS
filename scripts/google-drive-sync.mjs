import fs from 'fs';
import { google } from 'googleapis';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. .env 파싱 유틸
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

// Firebase 설정
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

// API Key 검사
const geminiApiKey = env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) {
    console.error('Error: VITE_GEMINI_API_KEY is not defined in .env file.');
    process.exit(1);
}

// Google Credentials 검사
const credentialsPath = './google-credentials.json';
const hasCredentials = fs.existsSync(credentialsPath);

// 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const genAI = new GoogleGenerativeAI(geminiApiKey);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getDriveClient() {
    if (!hasCredentials) {
        throw new Error(`Google credentials file not found at: ${credentialsPath}. Please read the setup guide.`);
    }
    const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });
    return drive;
}

// 특정 이름의 폴더 ID 가져오기
async function findFolderId(drive, folderName, parentId = null) {
    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
    if (parentId) {
        query += ` and '${parentId}' in parents`;
    }
    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });
    const files = res.data.files;
    return files && files.length > 0 ? files[0].id : null;
}

// 특정 폴더 하위의 모든 서브폴더 목록 가져오기
async function listSubfolders(drive, parentId) {
    const res = await drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive'
    });
    return res.data.files || [];
}

// 특정 폴더 하위의 처리되지 않은 이미지 파일 목록 가져오기 (_uploaded가 파일명에 없음)
async function listNewImages(drive, folderId) {
    const res = await drive.files.list({
        q: `'${folderId}' in parents and (mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/webp') and trashed = false`,
        fields: 'files(id, name, mimeType)',
        spaces: 'drive'
    });
    return (res.data.files || []).filter(f => !f.name.includes('_uploaded'));
}

// 대표 공통 시그니처 다국어 해시태그 강제 주입 함수
function injectCommonSEOKeywords(aiTags, translations) {
    const commonKo = ['핏걸즈', '바디프로필', '한국 바디프로필'];
    const commonEn = ['fitgirls', 'body profile', 'Korean body profile'];
    const commonJa = ['fitgirls', 'ボディプロフィール', '韓国ボディプロフィール'];
    const commonZh = ['fitgirls', '个人写真', '韩国身形写真'];

    // 중복 방지하며 추가
    commonKo.forEach(tag => {
        if (!aiTags.includes(tag)) aiTags.push(tag);
    });
    
    if (!translations.en) translations.en = [];
    commonEn.forEach(tag => {
        if (!translations.en.includes(tag)) translations.en.push(tag);
    });

    if (!translations.ja) translations.ja = [];
    commonJa.forEach(tag => {
        if (!translations.ja.includes(tag)) translations.ja.push(tag);
    });

    if (!translations.zh) translations.zh = [];
    commonZh.forEach(tag => {
        if (!translations.zh.includes(tag)) translations.zh.push(tag);
    });
}

// 대표님 지정 폴더명 ➡️ 웹사이트 소분류 type 코드 매핑
function getSubCategoryType(folderName) {
    const name = folderName.trim();
    if (name.includes('여자')) return 'women';
    if (name.includes('남자')) return 'men';
    if (name.includes('우정') || name.includes('커플')) return 'couple';
    if (name.includes('발리') || name.includes('야외') || name.includes('아웃도어')) return 'outdoor';
    return 'women'; // 기본값 fallback
}

async function runSync() {
    console.log(`\n==================================================`);
    console.log(`🔄 [Fitgirls.me] Google Drive ➡️ Website 동기화 배치가 시작됩니다.`);
    console.log(`📂 [설정 방식]: 성별 분류 폴더 감지 (여자/남자/우정&커플/발리프로젝트)`);
    console.log(`📂 [공통 태그 적용]: 핏걸즈, 바디프로필, 한국 바디프로필 (다국어 포함) 자동 강제 삽입`);
    console.log(`==================================================\n`);

    if (!hasCredentials) {
        console.error(`❌ 에러: 구글 인증 키 파일 (${credentialsPath}) 이 누락되었습니다.`);
        return;
    }

    try {
        const drive = await getDriveClient();
        
        console.log(`1. 구글 드라이브 루트 폴더 'Fitgirls_Archive' 탐색 중...`);
        const rootFolderId = await findFolderId(drive, 'Fitgirls_Archive');
        if (!rootFolderId) {
            console.error(`❌ 에러: 'Fitgirls_Archive' 루트 폴더를 구글 드라이브에서 찾을 수 없습니다.`);
            console.log(`ℹ️  [해결 방법]: 구글 드라이브에 'Fitgirls_Archive' 폴더를 만들고, 서비스 계정 이메일을 편집자로 공유해 주세요.`);
            return;
        }
        console.log(`  └ 루트 폴더 발견 (ID: ${rootFolderId})`);

        // 대분류 2개 검색
        console.log(`\n2. 브랜드 대분류 폴더 스캔 중...`);
        const fitgirlsParentId = await findFolderId(drive, '01_FITGIRLS_&_INAFIT', rootFolderId);
        const neverlandParentId = await findFolderId(drive, '02_NEVERLAND_SELF', rootFolderId);

        const brands = [];
        if (fitgirlsParentId) brands.push({ id: fitgirlsParentId, mainCategory: 'fitorialist', name: '01_FITGIRLS_&_INAFIT' });
        if (neverlandParentId) brands.push({ id: neverlandParentId, mainCategory: 'self', name: '02_NEVERLAND_SELF' });

        if (brands.length === 0) {
            console.warn(`⚠️  경고: 하위 대분류 브랜드 폴더('01_FITGIRLS_&_INAFIT' 또는 '02_NEVERLAND_SELF')가 존재하지 않습니다.`);
            return;
        }

        const tagModel = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        
        // 프롬프트 보강: 성별 탭 분류로 들어가지만, 공간 테마 태그(브라운그레이, 핑크카페트 등)도 AI가 자동 태그로 추출해 주도록 보강
        const prompt = `이 사진의 인물 포즈, 분위기, 장소, 의상(종류 및 색상) 및 배경 테마존(예: 브라운그레이, 핑크카페트, 내추럴화이트 등 공간명)을 분석해서, 갤러리 검색용으로 적합한 상세 해시태그 단어를 한국어(ko), 영어(en), 일본어(ja), 중국어(zh)로 각각 추출해줘.
        결과는 다른 부연설명 없이 오직 순수한 JSON 포맷으로만 응답해야 해.
        JSON 스키마:
        {
          "ko": ["단어1", "단어2", ...],
          "en": ["word1", "word2", ...],
          "ja": ["ワード1", "ワード2", ...],
          "zh": ["词语1", "词语2", ...]
        }
        한국어(ko) 해시태그는 최대 8개까지로 하고, 영어/일본어/중국어는 한국어 단어를 직역 또는 그에 걸맞게 매칭하여 동일한 순서와 개수로 번역/대응해서 추출해줘. '#' 문자는 포함하지 마.`;

        let totalSuccess = 0;

        for (const brand of brands) {
            console.log(`\n📂 브랜드 폴더 스캔: [${brand.name}] (MainCategory: ${brand.mainCategory})`);
            const subfolders = await listSubfolders(drive, brand.id);
            console.log(`  └ 발견된 서브 분류 폴더 개수: ${subfolders.length}개`);

            for (const subfolder of subfolders) {
                const subCatType = getSubCategoryType(subfolder.name);
                console.log(`   └ 분류 폴더 스캔: [${subfolder.name}] ➡️ 매핑된 웹사이트 카테고리: [${subCatType}]`);
                const newImages = await listNewImages(drive, subfolder.id);
                
                if (newImages.length === 0) {
                    continue;
                }
                console.log(`     └ 🆕 동기화가 필요한 신규 이미지 발견: ${newImages.length}장`);

                for (const imgFile of newImages) {
                    console.log(`     └ ⬇️  다운로드 시작: [${imgFile.name}] (ID: ${imgFile.id})`);
                    
                    try {
                        // 1. 구글 드라이브로부터 바이너리 다운로드
                        const fileRes = await drive.files.get({
                            fileId: imgFile.id,
                            alt: 'media'
                        }, { responseType: 'arraybuffer' });
                        
                        const fileBuffer = Buffer.from(fileRes.data);
                        console.log(`       └ 다운로드 완료 (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

                        // 2. 파이어베이스 스토리지로 파일 업로드
                        const storagePath = `gallery/${Date.now()}_${imgFile.name}`;
                        const storageRef = ref(storage, storagePath);
                        console.log(`       └ 파이어베이스 스토리지 업로드 중...`);
                        await uploadBytes(storageRef, fileBuffer, { contentType: imgFile.mimeType });
                        const optimizedUrl = await getDownloadURL(storageRef);
                        console.log(`       └ 업로드 완료 (URL 획득)`);

                        // 3. AI 자동 해시태그 & 다국어 번역본 추출
                        console.log(`       └ AI 이미지 분석 및 다국어 해시태그 생성 중 (Gemini)...`);
                        const base64Image = fileBuffer.toString('base64');
                        const filePart = {
                            inlineData: {
                                data: base64Image,
                                mimeType: imgFile.mimeType
                            }
                        };
                        
                        let aiTags = [];
                        let translations = { en: [], ja: [], zh: [] };
                        try {
                            const tagResult = await tagModel.generateContent([prompt, filePart]);
                            const responseText = tagResult.response.text();
                            const parsed = JSON.parse(responseText);
                            
                            aiTags = parsed.ko || [];
                            translations = {
                                en: parsed.en || [],
                                ja: parsed.ja || [],
                                zh: parsed.zh || []
                            };

                            // 공통 시그니처 대표 다국어 키워드 강제 추가
                            injectCommonSEOKeywords(aiTags, translations);

                            console.log(`         └ 생성된 태그(ko):`, aiTags);
                        } catch (tagErr) {
                            console.error(`         └ ❌ AI 태깅 실패 (기본값 설정):`, tagErr.message);
                        }

                        // 4. AI 이미지 임베딩 벡터 생성
                        console.log(`       └ AI 이미지 벡터 임베딩 추출 중...`);
                        let imageEmbedding = null;
                        try {
                            const embedResult = await embeddingModel.embedContent({
                                content: {
                                    parts: [
                                        {
                                            inlineData: {
                                                data: base64Image,
                                                mimeType: imgFile.mimeType
                                            }
                                        }
                                    ]
                                }
                            });
                            if (embedResult && embedResult.embedding && embedResult.embedding.values) {
                                imageEmbedding = embedResult.embedding.values;
                                console.log(`         └ 임베딩 완료! 차원 수:`, imageEmbedding.length);
                            }
                        } catch (embedErr) {
                            console.error(`         └ ❌ 임베딩 추출 실패:`, embedErr.message);
                        }

                        // 5. Firestore 갤러리 문서 자동 등록
                        console.log(`       └ Firestore 갤러리 컬렉션 등록 중...`);
                        const galleryData = {
                            mainCategory: brand.mainCategory,
                            type: subCatType, // 매핑된 카테고리 (women, men, couple, outdoor 등)
                            tags: [], // 수동 입력 태그는 빈 값으로 설정
                            aiTags: aiTags,
                            imageEmbedding: imageEmbedding,
                            translations: translations,
                            seoTags: aiTags.join(', '), // SEO 검색 최적화
                            imageUrl: optimizedUrl,
                            storagePath: storagePath,
                            name: imgFile.name,
                            size: fileBuffer.length,
                            order: Date.now(),
                            createdAt: serverTimestamp()
                        };

                        const docRef = await addDoc(collection(db, 'gallery'), galleryData);
                        console.log(`       └ ✅ Firestore 등록 성공 (문서 ID: ${docRef.id})`);

                        // 6. 구글 드라이브 상의 원본 파일명 변경 (_uploaded 접미사 추가)
                        console.log(`       └ 구글 드라이브 파일명 완료 표시 중...`);
                        const dotIndex = imgFile.name.lastIndexOf('.');
                        const baseName = dotIndex !== -1 ? imgFile.name.substring(0, dotIndex) : imgFile.name;
                        const ext = dotIndex !== -1 ? imgFile.name.substring(dotIndex) : '';
                        const newName = `${baseName}_uploaded${ext}`;

                        await drive.files.update({
                            fileId: imgFile.id,
                            resource: { name: newName }
                        });
                        console.log(`       └ ✅ 드라이브 파일 완료 표시 완료 (파일명 변경: ${newName})`);
                        
                        totalSuccess++;

                        // API 요율 완화 대기 (3.5초)
                        console.log(`       └ API Rate limit 조절용 3.5초 대기...`);
                        await sleep(3500);

                    } catch (itemErr) {
                        console.error(`       ❌ [${imgFile.name}] 처리 도중 에러가 발생했습니다:`, itemErr.message);
                    }
                }
            }
        }

        console.log(`\n==================================================`);
        console.log(`🏁 [Fitgirls.me] Google Drive 동기화 배치 종료`);
        console.log(`- 최종 동기화 완료 화보 수: ${totalSuccess}장`);
        console.log(`==================================================\n`);

    } catch (err) {
        console.error(`❌ 구글 드라이브 API 연동 중 치명적인 에러 발생:`, err.message);
    }
}

runSync();
