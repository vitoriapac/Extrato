export interface IndexedDbProviderConfig {
  dbName?: string;
  dbVersion?: number;
  storeName?: string;
  indexedDB?: IDBFactory;
}

export interface IndexedDbProvider {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<boolean>;
  remove: (key: string) => Promise<boolean>;
}

export function createIndexedDbProvider({
  dbName = '',
  dbVersion = 1,
  storeName = '',
  indexedDB = globalThis.indexedDB,
}: IndexedDbProviderConfig = {}): IndexedDbProvider {
  const open = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      if (!indexedDB) {
        reject(new Error('IndexedDB indisponível'));
        return;
      }
      const request = indexedDB.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName))
          request.result.createObjectStore(storeName);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  const transaction = async (
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest
  ): Promise<any> => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode),
        request = operation(tx.objectStore(storeName));
      request.onsuccess = () => {
        if (mode === 'readonly') resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => {
        db.close();
        if (mode !== 'readonly') resolve(true);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  };
  return {
    get: (key: string) => transaction('readonly', store => store.get(key)),
    set: (key: string, value: any) => transaction('readwrite', store => store.put(value, key)),
    remove: (key: string) => transaction('readwrite', store => store.delete(key)),
  };
}
