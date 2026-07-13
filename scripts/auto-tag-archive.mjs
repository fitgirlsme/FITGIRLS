import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

// 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const genAI = new GoogleGenerativeAI(geminiApiKey);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 이미지 URL을 다운로드하여 base64 및 mimeType 정보로 변환하는 함수
async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        // Content-Type 헤더를 통해 MimeType 확인, 없으면 기본값 적용
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        
        return {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };
    } catch (err) {
        console.error(`Failed to download image from url: ${url}`, err);
        return null;
    }
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

async function runAutoTagging() {
    // 인자 분석 (--limit=5, --dry-run 등)
    const args = process.argv.slice(2);
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limitVal = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
    const isDryRun = args.includes('--dry-run');

    console.log(`\n==================================================`);
    console.log(`🚀 [Fitgirls.me] AI 자동 태깅, 번역 & 임베딩 배치 작업 시작`);
    console.log(`📂 [공통 태그 적용]: 핏걸즈, 바디프로필, 한국 바디프로필 (다국어 포함) 자동 강제 삽입`);
    if (isDryRun) console.log(`⚠️  DRY-RUN 모드 활성화: 데이터베이스를 실제로 업데이트하지 않습니다.`);
    if (limitVal) console.log(`ℹ️  제한 적용: 최대 ${limitVal}개의 문서만 처리합니다.`);
    console.log('==================================================\n');

    console.log('1. Firestore에서 갤러리 이미지 로드 중...');
    const galleryCol = collection(db, 'gallery');
    const snapshot = await getDocs(galleryCol);
    const allDocs = [];
    
    snapshot.forEach(d => {
        allDocs.push({ id: d.id, ...d.data() });
    });

    console.log(`- 전체 갤러리 이미지 개수: ${allDocs.length}장`);

    // aiTags, imageEmbedding 또는 translations가 누락되었거나 비어있는 문서 필터링
    const targetDocs = allDocs.filter(d => 
        (!d.aiTags || d.aiTags.length === 0) || 
        (!d.imageEmbedding || d.imageEmbedding.length === 0) ||
        (!d.translations || !d.translations.en || d.translations.en.length === 0)
    );
    console.log(`- AI 마이그레이션이 필요한 이미지 개수: ${targetDocs.length}장`);

    if (targetDocs.length === 0) {
        console.log('🎉 모든 기존 이미지에 이미 AI 태깅, 번역 및 임베딩이 적용되어 있습니다. 작업을 종료합니다.');
        return;
    }

    const processLimit = limitVal ? Math.min(limitVal, targetDocs.length) : targetDocs.length;
    const processQueue = targetDocs.slice(0, processLimit);

    console.log(`▶ 총 ${processLimit}개의 이미지에 대해 순차 진행합니다...`);
    
    const tagModel = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest",
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: [
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
            }
        ]
    });
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const prompt = `이 사진의 인물 포즈, 분위기, 장소, 의상(종류 및 색상) 등을 분석해서, 갤러리 검색용으로 적합한 상세 해시태그 단어를 한국어(ko), 영어(en), 일본어(ja), 중국어(zh)로 각각 추출해줘.
    결과는 다른 부연설명 없이 오직 순수한 JSON 포맷으로만 응답해야 해.
    JSON 스키마:
    {
      "ko": ["단어1", "단어2", ...],
      "en": ["word1", "word2", ...],
      "ja": ["ワード1", "ワード2", ...],
      "zh": ["词语1", "词语2", ...]
    }
    한국어(ko) 해시태그는 최대 8개까지로 하고, 영어/일본어/중국어는 한국어 단어를 직역 또는 그에 걸맞게 매칭하여 동일한 순서와 개수로 번역/대응해서 추출해줘. '#' 문자는 포함하지 마.`;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < processQueue.length; i++) {
        const item = processQueue[i];
        const imageUrl = item.imageUrl || item.img;
        
        console.log(`\n[${i + 1}/${processQueue.length}] 문서 ID: [${item.id}] / 파일명: ${item.name || 'N/A'}`);
        
        if (!imageUrl) {
            console.log(`❌ 이미지 URL이 없습니다. 건너뜁니다.`);
            failCount++;
            continue;
        }

        console.log(`- 이미지 다운로드 중... (${imageUrl.substring(0, 70)}...)`);
        const filePart = await fetchImageAsBase64(imageUrl);
        
        if (!filePart) {
            console.log(`❌ 이미지 다운로드 및 Base64 변환 실패. 건너뜁니다.`);
            failCount++;
            continue;
        }

        let aiTags = item.aiTags || [];
        let translations = item.translations || { en: [], ja: [], zh: [] };
        let imageEmbedding = item.imageEmbedding || null;
        let shouldUpdate = false;

        // 1. AI 태깅 및 다국어 번역 처리
        if (aiTags.length === 0) {
            console.log(`- AI 해시태그 및 다국어 번역 분석 진행 중...`);
            try {
                const result = await tagModel.generateContent([prompt, filePart]);
                const responseText = result.response.text();
                const parsed = JSON.parse(responseText);
                
                aiTags = parsed.ko || [];
                translations = {
                    en: parsed.en || [],
                    ja: parsed.ja || [],
                    zh: parsed.zh || []
                };
                
                // 공통 키워드 주입
                injectCommonSEOKeywords(aiTags, translations);
                
                console.log(`  └ 추천 태그:`, aiTags);
                console.log(`  └ 번역본:`, translations);
                if (aiTags.length > 0) shouldUpdate = true;
            } catch (tagErr) {
                console.error(`  └ ❌ AI 태깅 실패:`, tagErr.message);
                if (tagErr.message.includes('PROHIBITED_CONTENT') || tagErr.message.includes('blocked') || tagErr.message.includes('Text not available')) {
                    console.log(`  └ ⚠️ 콘텐츠 필터(PROHIBITED_CONTENT)로 인해 기본 태그로 대체합니다.`);
                    aiTags = [];
                    translations = { en: [], ja: [], zh: [] };
                    injectCommonSEOKeywords(aiTags, translations);
                    shouldUpdate = true;
                }
            }
        } else if (!translations || !translations.en || translations.en.length === 0) {
            console.log(`- 기존 AI 태그 다국어 번역본 분석 진행 중...`);
            try {
                // 기존 태그 리스트를 번역하도록 텍스트만 전송 (비용 극소화)
                const textModel = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });
                const translatePrompt = `다음 한국어 해시태그 목록을 영어(en), 일본어(ja), 중국어(zh)로 각각 매칭하여 번역해줘.
                결과는 반드시 JSON 형식으로만 응답해야 해.
                형식:
                {
                  "en": ["word1", "word2", ...],
                  "ja": ["ワード1", "ワード2", ...],
                  "zh": ["词语1", "词语2", ...]
                }
                목록: ${aiTags.join(', ')}`;
                const result = await textModel.generateContent(translatePrompt);
                const responseText = result.response.text();
                const parsed = JSON.parse(responseText);
                
                translations = {
                    en: parsed.en || [],
                    ja: parsed.ja || [],
                    zh: parsed.zh || []
                };
                
                // 공통 키워드 주입
                injectCommonSEOKeywords(aiTags, translations);
                
                console.log(`  └ 기존 태그 번역본 생성 완료:`, translations);
                shouldUpdate = true;
            } catch (transErr) {
                console.error(`  └ ❌ 기존 태그 번역 실패:`, transErr.message);
            }
        } else {
            // 이미 태그와 번역본이 있는 경우에도, 혹시 공통 키워드가 누락되었다면 자동 추가
            const originalLength = aiTags.length;
            injectCommonSEOKeywords(aiTags, translations);
            if (aiTags.length !== originalLength) {
                console.log(`  └ 공통 SEO 대표 키워드 추가 완료:`, aiTags);
                shouldUpdate = true;
            } else {
                console.log(`- 기존 AI 태그 사용:`, aiTags);
                console.log(`- 기존 번역본 사용:`, translations);
            }
        }

        // 2. 멀티모달 임베딩 벡터 생성 (임베딩이 없을 경우에만 실행)
        if (!imageEmbedding || imageEmbedding.length === 0) {
            console.log(`- 이미지 임베딩 벡터 추출 진행 중...`);
            try {
                const embedResult = await embeddingModel.embedContent({
                    content: {
                        parts: [
                            {
                                inlineData: {
                                    data: filePart.inlineData.data,
                                    mimeType: filePart.inlineData.mimeType
                                }
                            }
                        ]
                    }
                });
                if (embedResult && embedResult.embedding && embedResult.embedding.values) {
                    imageEmbedding = embedResult.embedding.values;
                    console.log(`  └ 임베딩 벡터 추출 성공! 차원 수:`, imageEmbedding.length);
                    shouldUpdate = true;
                }
            } catch (embedErr) {
                console.error(`  └ ❌ 임베딩 벡터 생성 실패:`, embedErr.message);
                if (embedErr.message.includes('PROHIBITED_CONTENT') || embedErr.message.includes('blocked') || embedErr.message.includes('Text not available')) {
                    console.log(`  └ ⚠️ 임베딩 생성 불가로 3072차원 더미 벡터(0)를 주입합니다.`);
                    imageEmbedding = new Array(3072).fill(0);
                    shouldUpdate = true;
                }
            }
        } else {
            console.log(`- 기존 임베딩 사용 (차원 수: ${imageEmbedding.length})`);
        }

        if (!shouldUpdate) {
            console.log(`⚠️  업데이트할 변경 사항이 없습니다. 건너뜁니다.`);
            continue;
        }

        // 3. Firestore 데이터베이스 업데이트
        if (isDryRun) {
            console.log(`[DRY-RUN] Firestore 문서 [${item.id}] 업데이트를 시뮬레이션했습니다.`);
            successCount++;
        } else {
            try {
                const docRef = doc(db, 'gallery', item.id);
                await updateDoc(docRef, {
                    aiTags: aiTags,
                    translations: translations,
                    imageEmbedding: imageEmbedding,
                    seoTags: aiTags.join(', ') // SEO 검색 최적화 텍스트 갱신
                });
                console.log(`✅ [${i + 1}/${processQueue.length}] Firestore 문서 [${item.id}] 업데이트 성공!`);
                successCount++;
            } catch (updateErr) {
                console.error(`❌ Firestore 문서 업데이트 에러:`, updateErr.message);
                failCount++;
            }
        }

        // API 쿼터(Rate limit) 완화 대기 (3.5초)
        console.log(`- API Rate limit 조절용 3.5초 대기...`);
        await sleep(3500);
    }

    console.log(`\n==================================================`);
    console.log(`🏁 [Fitgirls.me] AI 자동 태깅 배치 작업 종료`);
    console.log(`- 성공: ${successCount}건 / 실패: ${failCount}건`);
    console.log(`==================================================\n`);
}

runAutoTagging();
