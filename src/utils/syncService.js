import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { STORES, saveData } from './db';

/**
 * 특정 컬렉션의 데이터를 Firestore에서 가져와 IndexedDB에 저장합니다.
 * @param {string} storeName - IndexedDB 스토어 이름 (STORES의 값 중 하나)
 * @param {string} collectionName - Firestore 컬렉션 이름 (통상 storeName과 동일)
 */
export const syncCollection = async (storeName, collectionName = storeName) => {
    try {
        console.log(`[Sync] Attempting to fetch collection: "${collectionName}"`);
        const ref = collection(db, collectionName);
        const snapshot = await getDocs(ref);
        
        console.log(`[Sync] Result for "${collectionName}": ${snapshot.size} documents found.`);

        const data = snapshot.docs.map((doc, index) => {
            const docData = doc.data();
            if (index === 0) {
                console.log(`[Sync] First document from "${collectionName}" sample:`, JSON.stringify(docData).slice(0, 200) + '...');
            }
            return {
                id: doc.id,
                ...docData,
                updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
            };
        });

        await saveData(storeName, data);
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
        syncCollection(STORES.GALLERY),
        syncCollection(STORES.FAQ),
        syncCollection(STORES.HERO_SLIDES),
        syncCollection(STORES.HOME_SECTIONS),
        syncCollection(STORES.LOOKBOOK),
    ];
    
    return Promise.all(syncPromises);
};
