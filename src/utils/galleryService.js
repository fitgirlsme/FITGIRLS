import { db } from './firebase';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where,
    limit,
    startAfter,
    doc,
    getDoc
} from "firebase/firestore";
import { getData, STORES } from './db';
import { syncCollection } from './syncService';
import { generateEmbedding } from './aiService';

/**
 * 기존: IndexedDB 기반 동기식 로드
 */
export const getGalleries = async (mainCategory = null) => {
    try {
        const storeName = mainCategory === 'LOOKBOOK' ? STORES.LOOKBOOK : STORES.GALLERY;
        
        let localData = await getData(storeName);
        
        if (!localData || localData.length === 0) {
            localData = await syncCollection(storeName);
        } else {
            // iOS OOM 방지를 위해 초기 렌더링 이후 여유를 두고 전체 백그라운드 갱신 (5초 지연)
            setTimeout(() => {
                syncCollection(storeName).catch(console.error);
            }, 5000);
        }
 
        let filtered = localData;
        
        if (storeName === STORES.GALLERY) {
            if (mainCategory && mainCategory !== 'ALL' && mainCategory !== 'STUDIO') {
                filtered = localData.filter(item => item.mainCategory === mainCategory);
            }
        }
 
        return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
        console.error("Error fetching galleries:", error);
        return [];
    }
};

/**
 * 신규: Firestore 직접 호출 및 페이지네이션 (성능 최적화용)
 */
export const getGalleriesPaginated = async ({ 
    mainCategory = 'fitorialist', 
    subCategory = 'women', 
    lastVisibleDoc = null, 
    pageSize = 30 
}) => {
    try {
        const galleryRef = collection(db, 'gallery');
        let q = query(
            galleryRef,
            where('mainCategory', '==', mainCategory),
            where('type', '==', subCategory),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastVisibleDoc) {
            q = query(q, startAfter(lastVisibleDoc));
        }

        const snapshot = await getDocs(q);
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            img: doc.data().imageUrl || doc.data().img || ''
        }));

        return { items, lastVisible, hasMore: items.length === pageSize };
    } catch (error) {
        console.error("Error in getGalleriesPaginated:", error);
        return { items: [], lastVisible: null, hasMore: false };
    }
};

/**
 * 코사인 유사도 계산 함수
 */
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * 신규: AI 시맨틱 검색 (클라이언트 단 벡터 연산)
 */
export const searchGalleriesSemantic = async (queryText, apiKey, allItems, limitCount = 20) => {
    try {
        if (!queryText || !apiKey || !allItems || allItems.length === 0) return [];
        
        // 1. Generate query embedding
        const queryVector = await generateEmbedding(queryText, apiKey);
        if (!queryVector || queryVector.length === 0) return [];

        // 2. Calculate similarities
        const queryLower = queryText.toLowerCase().trim();
        const scoredItems = allItems.map(item => {
            let itemVector = null;
            if (item.embedding) {
                if (Array.isArray(item.embedding)) itemVector = item.embedding;
                else if (item.embedding.toArray) itemVector = item.embedding.toArray();
                else if (item.embedding.values) itemVector = item.embedding.values;
            }
            
            // If item has no embedding, assign similarity -1
            const similarity = itemVector ? cosineSimilarity(queryVector, itemVector) : -1;
            
            // Exact/Substring Match in tags
            const matchTags = item.tags && item.tags.some(tag => tag.replace('#', '').toLowerCase().includes(queryLower));
            const matchAiTags = item.aiTags && item.aiTags.some(tag => tag.replace('#', '').toLowerCase().includes(queryLower));
            const isExactMatch = matchTags || matchAiTags;

            return { ...item, _similarity: similarity, _isExactMatch: isExactMatch };
        });

        // Calculate max similarity to establish a dynamic threshold
        let maxSim = -1;
        for (const item of scoredItems) {
            if (item._similarity > maxSim) maxSim = item._similarity;
        }

        // Dynamic threshold: within 0.12 of the best match, but never lower than 0.50
        let dynamicThreshold = maxSim - 0.12;
        if (dynamicThreshold < 0.50) dynamicThreshold = 0.50;

        // 3. Filter and Sort
        const results = scoredItems
            .filter(item => item._isExactMatch || item._similarity >= dynamicThreshold)
            .sort((a, b) => {
                // Exact matches always float to the top
                if (a._isExactMatch && !b._isExactMatch) return -1;
                if (!a._isExactMatch && b._isExactMatch) return 1;
                // Otherwise sort by AI similarity
                return b._similarity - a._similarity;
            })
            .slice(0, limitCount);

        return results;
    } catch (error) {
        console.error("Error in searchGalleriesSemantic:", error);
        throw error;
    }
};
