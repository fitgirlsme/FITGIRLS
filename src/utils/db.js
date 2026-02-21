const DB_NAME = 'FitgirlsDB';
const DB_VERSION = 1;
const STORE_NAME = 'gallery';

// 데이터베이스 초기화 및 연결
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => resolve(request.result);

        // 첫 방문 시 혹은 버전 업그레이드 시 저장소(Table) 생성
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

// 갤러리에 새 이미지 객체 저장
export const addGalleryItem = async (item) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // 저장 시간 타임스탬프 추가
        const itemWithTime = { ...item, createdAt: Date.now() };
        const request = store.add(itemWithTime);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// 저장된 갤러리 아이템 삭제
export const deleteGalleryItem = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// 저장된 모든 갤러리 아이템 불러오기 (최신순 정렬)
export const getGalleryItems = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const sortedItems = request.result.sort((a, b) => b.createdAt - a.createdAt);
            resolve(sortedItems);
        };
        request.onerror = () => reject(request.error);
    });
};
