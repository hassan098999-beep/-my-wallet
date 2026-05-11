export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('masarifi_db', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveBackupToDB = async (backup: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    const request = store.put(backup);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getBackupsFromDB = async (): Promise<any[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result || []).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
};

export const deleteBackupFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
