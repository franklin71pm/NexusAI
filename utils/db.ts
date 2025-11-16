
import { YearData } from '../types';

const DB_NAME = 'NexusOSDB';
const DB_VERSION = 1;
const STORE_NAME = 'yearlyData';
const DATA_KEY = 'allData';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', request.error);
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const getAllYearlyData = (): Promise<{ [year: number]: YearData } | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(DATA_KEY);

            request.onerror = () => {
                console.error('Error fetching data from DB:', request.error);
                reject('Error fetching data');
            };

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.value);
                } else {
                    resolve(null);
                }
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const saveAllYearlyData = (data: { [year: number]: YearData }): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ id: DATA_KEY, value: data });

            request.onerror = () => {
                console.error('Error saving data to DB:', request.error);
                reject('Error saving data');
            };

            request.onsuccess = () => {
                resolve();
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const clearYearlyData = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => {
                console.error('Error clearing data from DB:', request.error);
                reject('Error clearing data');
            };

            request.onsuccess = () => {
                resolve();
            };
        } catch (error) {
            reject(error);
        }
    });
}
