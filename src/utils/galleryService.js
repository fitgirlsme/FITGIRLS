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
            syncCollection(storeName).catch(console.error);
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
