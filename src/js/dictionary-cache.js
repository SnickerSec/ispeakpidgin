/**
 * DictionaryCache - Persistent client-side caching using IndexedDB
 * Handles storage, versioning, and retrieval of dictionary data
 */
class DictionaryCache {
    constructor() {
        this.dbName = 'PidginDictionaryDB';
        this.storeName = 'dictionary';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize the IndexedDB database
     */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    /**
     * Get data from cache
     * @param {string} key - Cache key (usually 'master_data')
     * @returns {Promise<Object|null>} Cached data or null
     */
    async get(key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Set data in cache
     * @param {string} key - Cache key
     * @param {Object} data - Data to store
     * @returns {Promise<void>}
     */
    async set(key, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(data, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete data from cache
     * @param {string} key - Cache key
     * @returns {Promise<void>}
     */
    async delete(key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all cached data
     */
    async clear() {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Create global instance
window.dictionaryCache = new DictionaryCache();
