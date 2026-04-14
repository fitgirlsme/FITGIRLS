import { db } from './firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { STORES, saveData } from './db';

/**
 * 특정 컬렉션의 데이터를 Firestore에서 가져와 IndexedDB에 저장합니다.
 * @param {string} storeName - IndexedDB 스토어 이름
 * @param {string} collectionName - Firestore 컬렉션 이름
 * @param {number} limitCount - 가져올 최대 개수 (null이면 전체)
 */
export const syncCollection = async (storeName, collectionName = storeName, limitCount = null) => {
    try {
        console.log(`[Sync] Attempting to fetch collection: "${collectionName}" (limit: ${limitCount || 'all'})`);
        const colRef = collection(db, collectionName);
        let q = query(colRef, orderBy('createdAt', 'desc'));
        
        if (limitCount) {
            q = query(q, limit(limitCount));
        }
        
        const snapshot = await getDocs(q);
        
        console.log(`[Sync] Result for "${collectionName}": ${snapshot.size} documents found.`);

        const data = snapshot.docs.map((doc, index) => {
            const docData = doc.data();
            return {
                id: doc.id,
                ...docData,
                updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        });

        // 갤러리는 너무 크면 클리어하지 않고 덮어씌우기만 하거나 부분 업데이트 고려 가능하나,
        // 현재는 단순화를 위해 saveData가 clear()를 포함함.
        // Gallery의 경우 limitCount가 있으면 절대 clear()하면 안 됨 (기존 로컬 데이터 유실 방지)
        await saveData(storeName, data, !!limitCount); // pass whether it's a partial sync
        
        console.log(`Successfully synced ${data.length} items for ${storeName}`);
        return data;
    } catch (error) {
        console.error(`Sync error for ${collectionName}:`, error);
        return [];
    }
};

/**
 * 모든 주요 컬렉션을 한꺼번에 동기화합니다.
 */
export const syncAll = async () => {
    const syncPromises = [
        syncCollection(STORES.NOTICES),
        syncCollection(STORES.REVIEWS),
        syncCollection(STORES.GALLERY, STORES.GALLERY, 100), // Gallery는 최근 100개만 우선 동기화
        syncCollection(STORES.FAQ),
        syncCollection(STORES.HERO_SLIDES),
        syncCollection(STORES.HOME_SECTIONS),
        syncCollection(STORES.LOOKBOOK),
        syncCollection(STORES.PARTNERS),
        syncCollection(STORES.STUDIOS),
    ];
    
    return Promise.all(syncPromises);
};
