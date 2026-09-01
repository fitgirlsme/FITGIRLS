const DB_NAME = 'FitgirlsLiveDB';
const DB_VERSION = 5;

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
    APPLICATIONS: 'applications',
    PARTNERS: 'partners',
    DIRECTOR: 'director_activities',
    ISSUES: 'issues',
    CHALLENGES: 'challenges',
    MONTHLY_PROJECTS: 'monthly_projects'
};

// Safari Private Browsing 또는 IndexedDB 지원 불가 환경을 위한 인메모리 캐시 폴백
const memoryStore = new Map();

export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject(new Error('IndexedDB not supported'));
        }

        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error || new Error('IndexedDB open error'));
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
        } catch (err) {
            reject(err);
        }
    });
};

// 범용 CRUD 헬퍼
export const saveData = async (storeName, items, isPartial = false) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        if (!isPartial) {
            store.clear();
        }
        items.forEach(item => store.put(item));
        return new Promise((resolve) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => resolve();
        });
    } catch (err) {
        // Fallback to memory store
        if (!isPartial) {
            memoryStore.set(storeName, [...items]);
        } else {
            const current = memoryStore.get(storeName) || [];
            const merged = [...current];
            items.forEach(item => {
                const idx = merged.findIndex(i => i.id === item.id);
                if (idx >= 0) merged[idx] = item;
                else merged.push(item);
            });
            memoryStore.set(storeName, merged);
        }
        return Promise.resolve();
    }
};

export const getData = async (storeName) => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve(memoryStore.get(storeName) || []);
        });
    } catch (err) {
        return memoryStore.get(storeName) || [];
    }
};

export const addItem = async (storeName, item) => {
    if (!item.id) item.id = Date.now().toString();
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            request.onsuccess = () => resolve(item.id);
            request.onerror = () => {
                const current = memoryStore.get(storeName) || [];
                memoryStore.set(storeName, [...current, item]);
                resolve(item.id);
            };
        });
    } catch (err) {
        const current = memoryStore.get(storeName) || [];
        memoryStore.set(storeName, [...current, item]);
        return item.id;
    }
};

export const deleteItem = async (storeName, id) => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                const current = memoryStore.get(storeName) || [];
                memoryStore.set(storeName, current.filter(i => i.id !== id));
                resolve();
            };
        });
    } catch (err) {
        const current = memoryStore.get(storeName) || [];
        memoryStore.set(storeName, current.filter(i => i.id !== id));
        return Promise.resolve();
    }
};

export const updateItem = async (storeName, id, updates) => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const data = { ...getRequest.result, ...updates };
                const putRequest = store.put(data);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => resolve();
            };
            getRequest.onerror = () => resolve();
        });
    } catch (err) {
        const current = memoryStore.get(storeName) || [];
        memoryStore.set(storeName, current.map(i => i.id === id ? { ...i, ...updates } : i));
        return Promise.resolve();
    }
};

// Gallery 특정 래퍼 (Gallery.jsx 호환성용)
export const getGalleryItems = () => getData(STORES.GALLERY);
export const addGalleryItem = (item) => addItem(STORES.GALLERY, item);
export const deleteGalleryItem = (id) => deleteItem(STORES.GALLERY, id);
export const updateGalleryItem = (id, updates) => updateItem(STORES.GALLERY, id, updates);
