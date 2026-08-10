import { db } from './firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { STORES, saveData } from './db';

const activeSyncs = {};

/**
 * 특정 컬렉션의 데이터를 Firestore에서 가져와 IndexedDB에 저장합니다.
 * @param {string} storeName - IndexedDB 스토어 이름
 * @param {string} collectionName - Firestore 컬렉션 이름
 * @param {number} limitCount - 가져올 최대 개수 (null이면 전체)
 */
export const syncCollection = async (storeName, collectionName = storeName, limitCount = null) => {
    const syncKey = `${storeName}_${limitCount || 'all'}`;
    
    if (activeSyncs[syncKey]) {
        console.log(`[Sync] Already syncing ${syncKey}, returning existing promise.`);
        return activeSyncs[syncKey];
    }

    const syncPromise = (async () => {
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
            // VectorValue 객체는 IndexedDB 저장 시 에러가 나므로 일반 배열로 변환
            if (docData.embedding && docData.embedding.toArray) {
                docData.embedding = docData.embedding.toArray();
            } else if (docData.embedding && Array.isArray(docData.embedding.values)) {
                docData.embedding = docData.embedding.values;
            }
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
    })();

    activeSyncs[syncKey] = syncPromise;
    try {
        return await syncPromise;
    } finally {
        delete activeSyncs[syncKey];
    }
};

/**
 * 모든 주요 컬렉션을 한꺼번에 동기화합니다.
 */
export const syncAll = async () => {
    // 1. 우선적으로 필요한 핵심 데이터 (히어로 슬라이드, 홈 섹션, 갤러리 100개 등)
    const criticalPromises = [
        syncCollection(STORES.HERO_SLIDES),
        syncCollection(STORES.HOME_SECTIONS),
        syncCollection(STORES.GALLERY, STORES.GALLERY, 100), // Gallery는 최근 100개만 우선 동기화
        syncCollection(STORES.NOTICES), // 공지사항도 상단 노출 대비
    ];
    
    // 2. 핵심 데이터를 먼저 기다림 (UI 초기 렌더링을 방해하지 않는 선에서)
    await Promise.all(criticalPromises);

    // 3. 나머지 무거운 데이터는 백그라운드에서 지연 동기화 (OOM, Boot Storm 방지)
    // iOS 기기 등에서 렌더링과 동시에 수천개의 JSON을 파싱하면 크래시가 발생하므로 지연 처리
    setTimeout(() => {
        console.log(`[Sync] Starting delayed background sync for non-critical collections...`);
        Promise.all([
            syncCollection(STORES.REVIEWS),
            syncCollection(STORES.FAQ),
            syncCollection(STORES.LOOKBOOK),
            syncCollection(STORES.PARTNERS),
            syncCollection(STORES.STUDIOS),
            syncCollection(STORES.CHALLENGES),
            syncCollection(STORES.MONTHLY_PROJECTS),
        ]).catch(err => console.error('[Sync] Delayed sync error:', err));
    }, 3500); // 애니메이션과 초기 렌더링이 안정화되는 시간 확보
};
