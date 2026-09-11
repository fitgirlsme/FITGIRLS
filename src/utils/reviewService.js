import { db } from './firebase';
import { ogirlsDb } from './ogirlsFirebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    Timestamp,
    getCountFromServer 
} from "firebase/firestore";
import reviewsBackup from '../data/reviews_backup.json';

const COLLECTION_NAME = 'reviews';

// 캐시 변수 (불필요한 반복 쿼리 방지)
let cachedReviews = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30초 캐시

// 총 리뷰 개수 및 통계 가져오기
export const getTotalReviewStats = async () => {
    try {
        const reviews = await getReviews('all');
        const count = reviews.length;
        const photoCount = reviews.filter(r => r.photos && r.photos.length > 0).length;
        const totalRating = reviews.reduce((acc, cur) => acc + (Number(cur.rating) || 5), 0);
        const avgRating = count > 0 ? (totalRating / count).toFixed(2) : '4.95';

        return {
            totalCount: count,
            photoCount,
            avgRating: Math.min(5, Math.max(4.9, Number(avgRating))).toFixed(2)
        };
    } catch (error) {
        console.error("Error getting review stats:", error);
        return { totalCount: 800, photoCount: 250, avgRating: '4.95' };
    }
};

export const getTotalReviewCount = async () => {
    const stats = await getTotalReviewStats();
    return stats.totalCount;
};

// 모든 리뷰 가져오기 (오걸즈 naver_reviews + google_reviews + 핏걸즈 백업 병합)
export const getReviews = async (filter = 'all') => {
    const now = Date.now();
    let allReviews = [];

    // 캐시 확인
    if (cachedReviews && (now - lastFetchTime < CACHE_TTL)) {
        allReviews = cachedReviews;
    } else {
        try {
            // 1. 오걸즈 naver_reviews 조회
            const naverQuery = query(
                collection(ogirlsDb, 'naver_reviews'),
                orderBy('createdAtTimestamp', 'desc'),
                limit(800)
            );
            const naverSnap = await getDocs(naverQuery);
            const naverList = naverSnap.docs.map(doc => {
                const d = doc.data();
                return {
                    id: `naver_${doc.id}`,
                    originalId: doc.id,
                    source: 'naver',
                    author: d.author || '네이버 예약 고객',
                    rating: Number(d.rating) || 5,
                    body: d.body || '',
                    text: d.body || '',
                    content: d.body || '',
                    title: d.bookingItemName || (d.brand === 'neverland' ? '네버랜드 셀프스튜디오' : '핏걸즈&이너핏 바디프로필'),
                    brand: d.brand || (d.bookingItemName?.includes('셀프') ? 'neverland' : 'fitgirls'),
                    photos: Array.isArray(d.photos) ? d.photos : [],
                    img: (d.photos && d.photos.length > 0) ? d.photos[0] : null,
                    imageUrl: (d.photos && d.photos.length > 0) ? d.photos[0] : null,
                    created: d.created || '',
                    createdAt: d.createdAtTimestamp || (d.crawledAt ? new Date(d.crawledAt).toISOString() : new Date().toISOString()),
                    isPinned: !!d.isPinned,
                    visitCount: d.visitCount || 1,
                    verified: true
                };
            });

            // 2. 오걸즈 google_reviews 조회
            let googleList = [];
            try {
                const googleQuery = query(collection(ogirlsDb, 'google_reviews'), limit(50));
                const googleSnap = await getDocs(googleQuery);
                googleList = googleSnap.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: `google_${doc.id}`,
                        originalId: doc.id,
                        source: 'google',
                        author: d.author_name || '구글 사용자',
                        rating: Number(d.rating) || 5,
                        body: d.text || '',
                        text: d.text || '',
                        content: d.text || '',
                        title: 'Google 리뷰',
                        brand: 'fitgirls',
                        photos: d.profile_photo_url ? [d.profile_photo_url] : [],
                        img: null,
                        created: d.relative_time_description || '',
                        createdAt: d.time ? new Date(d.time * 1000).toISOString() : new Date().toISOString(),
                        verified: true
                    };
                });
            } catch (gErr) {
                console.warn("Google reviews fetch error:", gErr);
            }

            // 3. 핏걸즈 자체/백업 리뷰 병합 (ID 중복 제거)
            const idSet = new Set([...naverList.map(r => r.originalId), ...googleList.map(r => r.originalId)]);
            const backupList = (reviewsBackup || []).filter(b => !idSet.has(b.id)).map(b => ({
                id: `backup_${b.id}`,
                source: 'fitgirls',
                author: b.author || '고객님',
                rating: 5,
                body: b.text || b.content || '',
                text: b.text || b.content || '',
                content: b.text || b.content || '',
                title: b.title || '핏걸즈 스튜디오',
                brand: 'fitgirls',
                photos: (b.img || b.imageUrl) ? [b.img || b.imageUrl] : [],
                img: b.img || b.imageUrl || null,
                created: b.createdAt || '',
                createdAt: b.createdAt || '',
                verified: true
            }));

            // 전체 통합 및 정렬 (핀 고정 리뷰 우선, 그 다음 최신순)
            allReviews = [...naverList, ...googleList, ...backupList].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                return timeB - timeA;
            });

            cachedReviews = allReviews;
            lastFetchTime = now;
        } catch (error) {
            console.error("Error fetching integrated reviews:", error);
            allReviews = reviewsBackup || [];
        }
    }

    // 필터링 적용
    if (!filter || filter === 'all') {
        return allReviews;
    }
    if (filter === 'fitgirls') {
        return allReviews.filter(r => r.brand === 'fitgirls');
    }
    if (filter === 'neverland') {
        return allReviews.filter(r => r.brand === 'neverland');
    }
    if (filter === 'photo') {
        return allReviews.filter(r => (r.photos && r.photos.length > 0) || r.img);
    }
    if (filter === 'naver') {
        return allReviews.filter(r => r.source === 'naver');
    }
    if (filter === 'google') {
        return allReviews.filter(r => r.source === 'google');
    }

    return allReviews;
};

// 새 리뷰 작성하기 (핏걸즈 자체 DB 저장)
export const addReview = async (reviewData) => {
    try {
        const reviewsRef = collection(db, COLLECTION_NAME);
        const docRef = await addDoc(reviewsRef, {
            ...reviewData,
            createdAt: Timestamp.now()
        });
        // 캐시 무효화
        cachedReviews = null;
        return docRef.id;
    } catch (error) {
        console.error("Error adding review:", error);
        throw error;
    }
};

