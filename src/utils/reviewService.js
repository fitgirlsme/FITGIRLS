import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    where,
    Timestamp,
    getCountFromServer 
} from "firebase/firestore";
import { getData, STORES } from './db';
import { syncCollection } from './syncService';

const COLLECTION_NAME = 'reviews';

// 총 리뷰 개수 가져오기
export const getTotalReviewCount = async () => {
    try {
        const localData = await getData(STORES.REVIEWS);
        if (localData && localData.length > 0) return localData.length;

        const reviewsRef = collection(db, COLLECTION_NAME);
        const snapshot = await getCountFromServer(reviewsRef);
        return snapshot.data().count;
    } catch (error) {
        console.error("Error getting count:", error);
        return 0;
    }
};

// 모든 리뷰 가져오기 (최신순)
export const getReviews = async (tag = 'all') => {
    try {
        // 1. IndexedDB 데이터 확인
        let localData = await getData(STORES.REVIEWS);
        
        if (!localData || localData.length === 0) {
            localData = await syncCollection(STORES.REVIEWS);
        } else {
            // 백그라운드 동기화
            syncCollection(STORES.REVIEWS).catch(console.error);
        }

        let filtered = localData;
        if (tag !== 'all') {
            filtered = localData.filter(review => review.tags?.includes(tag));
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        }).map(review => ({
            ...review,
            createdAt: review.createdAt ? (typeof review.createdAt === 'string' ? review.createdAt : new Date(review.createdAt).toLocaleDateString()) : ''
        }));
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

// 새 리뷰 작성하기
export const addReview = async (reviewData) => {
    try {
        const reviewsRef = collection(db, COLLECTION_NAME);
        const docRef = await addDoc(reviewsRef, {
            ...reviewData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding review:", error);
        throw error;
    }
};
