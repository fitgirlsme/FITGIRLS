import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

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

async function seedReviews() {
    console.log('🔄 reviews_backup.json 읽는 중...');
    const rawData = fs.readFileSync('./src/data/reviews_backup.json', 'utf8');
    const reviews = JSON.parse(rawData);
    
    // 앞에서 20개만 번역이 포함되어 있으므로, 전체를 업로드하되 20개는 확실히 확인
    console.log(`📄 총 ${reviews.length}개의 리뷰 중 상위 20개를 우선적으로 처리합니다.`);
    
    let successCount = 0;
    
    // Firestore에는 id가 문서 ID로 사용되도록 설정
    for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        try {
            // setDoc을 사용하여 문서가 없으면 생성, 있으면 덮어쓰기
            await setDoc(doc(db, 'reviews', review.id), {
                ...review,
                updatedAt: new Date().toISOString()
            });
            successCount++;
            if (i < 20) {
                console.log(`✅ [${i+1}/20] 업로드 완료: ${review.id}`);
            }
        } catch (error) {
            console.error(`❌ 업로드 실패: ${review.id}`, error.message);
        }
    }
    
    console.log(`\n🎉 완료! 총 ${successCount}개의 리뷰가 Firestore에 업로드되었습니다.`);
    process.exit(0);
}

seedReviews().catch(err => {
    console.error('치명적 오류:', err);
    process.exit(1);
});
