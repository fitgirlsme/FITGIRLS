import { db } from './firebase';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where 
} from "firebase/firestore";
import { getData, STORES } from './db';
import { syncCollection } from './syncService';

export const getGalleries = async (mainCategory = null) => {
    try {
        const storeName = mainCategory === 'LOOKBOOK' ? STORES.LOOKBOOK : STORES.GALLERY;
        
        // 1. IndexedDB 데이터 확인
        let localData = await getData(storeName);
        
        if (!localData || localData.length === 0) {
            localData = await syncCollection(storeName);
        } else {
            // 백그라운드 동기화
            syncCollection(storeName).catch(console.error);
        }
 
        let filtered = localData;
        
        // 갤러리 컬렉션일 경우 필터링 적용 (LOOKBOOK은 그 자체로 필터링됨)
        if (storeName === STORES.GALLERY) {
            if (mainCategory && mainCategory !== 'ALL' && mainCategory !== 'STUDIO') {
                filtered = localData.filter(item => item.mainCategory === mainCategory);
            }
            // STUDIO 탭일 경우 fitorialist를 기본으로 보여주거나 전체를 보여줌
            // 라이브 사이트 기준에 맞춰 조정 필요
        }
 
        return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error("Error fetching galleries:", error);
        return [];
    }
};
