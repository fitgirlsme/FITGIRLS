import { db } from './firebase';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit 
} from "firebase/firestore";
import { getData, STORES } from './db';
import { syncCollection } from './syncService';

/**
 * 데이터를 가져옵니다. 
 * 1. 우선 IndexedDB(로컬)에서 가져옵니다.
 * 2. 데이터가 없으면 Firestore에서 가져와서 로컬을 업데이트하고 반환합니다.
 * @param {string} collectionName - Firestore 컬렉션 이름
 * @param {string} orderField - 정렬 기준 필드
 * @param {string} orderDir - 정렬 방향
 * @param {number} maxLimit - 최대 개수
 */
export const fetchData = async (collectionName, orderField = 'createdAt', orderDir = 'desc', maxLimit = 50) => {
    try {
        // 1. IndexedDB에서 먼저 확인
        const localData = await getData(collectionName);
        
        if (localData && localData.length > 0) {
            console.log(`Loading ${collectionName} from Local Cache`);
            // 비동기로 백그라운드 동기화 트리거 (선택 사항)
            syncCollection(collectionName).catch(console.error);
            
            // 정렬 및 리미트 적용 (IndexedDB results are usually not ordered the same way)
            return localData
                .sort((a, b) => {
                    const valA = a[orderField];
                    const valB = b[orderField];
                    if (orderDir === 'desc') return valB > valA ? 1 : -1;
                    return valA > valB ? 1 : -1;
                })
                .slice(0, maxLimit);
        }

        // 2. 데이터가 없으면 직접 동기화 호출
        console.log(`No local data for ${collectionName}, fetching from Cloud...`);
        return await syncCollection(collectionName);
    } catch (error) {
        console.error(`Error fetching from ${collectionName}:`, error);
        return [];
    }
};
