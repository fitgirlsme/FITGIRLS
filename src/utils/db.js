const DB_NAME = 'FitgirlsLiveDB';
const DB_VERSION = 1;

// 컬렉션 명칭을 라이브 사이트와 1:1 매칭
export const STORES = {
    NOTICES: 'events',
    REVIEWS: 'reviews',
    PROGRAMS: 'programs',
    STUDIOS: 'studios',
    GALLERY: 'gallery',
    FAQ: 'faq',
    HERO_SLIDES: 'hero_slides',
    HOME_SECTIONS: 'home_sections',
    LOOKBOOK: 'lookbook',
    MODELS: 'models',
    APPLICATIONS: 'applications'
};

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            // 모든 필요 저장소 생성
            Object.values(STORES).forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
    });
};

// 범용 CRUD 헬퍼
export const saveData = async (storeName, items) => {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();
    items.forEach(item => store.put(item));
    return new Promise((resolve) => {
        transaction.oncomplete = () => resolve();
    });
};

export const getData = async (storeName) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addItem = async (storeName, item) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        if (!item.id) item.id = Date.now().toString();
        const request = store.add(item);
        request.onsuccess = () => resolve(item.id);
        request.onerror = () => reject(request.error);
    });
};

export const deleteItem = async (storeName, id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const updateItem = async (storeName, id, updates) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
            const data = { ...getRequest.result, ...updates };
            const putRequest = store.put(data);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
};

// Gallery 특정 래퍼 (Gallery.jsx 호환성용)
export const getGalleryItems = () => getData(STORES.GALLERY);
export const addGalleryItem = (item) => addItem(STORES.GALLERY, item);
export const deleteGalleryItem = (id) => deleteItem(STORES.GALLERY, id);
export const updateGalleryItem = (id, updates) => updateItem(STORES.GALLERY, id, updates);

