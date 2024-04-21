import { AsyncStorage } from "./Storage";

export class IndexedDbStorage extends AsyncStorage {
  private db: Promise<IDBDatabase> | IDBDatabase;

  constructor(
    name: string,
    version: number,
    upgrade: (oldVersion: number, newVersion: number | null, db: IDBDatabase) => void,
    indexedDB = globalThis.indexedDB,
  ) {
    if (version <= 0) {
      throw new Error("IndexedDbStorage version must be a positive integer");
    }

    super();

    this.db = new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onsuccess = () => {
        resolve(request.result);
        this.db = request.result;
      };

      request.onerror = () => {
        reject(request.error ?? new Error("unknown error opening IndexedDB"));
      };

      request.onblocked = () => {
        reject(new Error("upgrade blocked by another tab")); // TODO deal with blocked upgrade
      };

      request.onupgradeneeded = (event) => {
        const target = event.target;
        if (!target) {
          const error = new Error("no DB to target when needing to do an upgrade");
          reject(error);
          throw error;
        }

        const db = (target as IDBVersionChangeEvent & IDBRequest<IDBDatabase>).result;
        upgrade(event.oldVersion, event.newVersion, db);
      };
    });
  }

  /** @override */
  async set(namespace: string, subkey: string, value: string) {
    const db = await this.db;
    const transaction = db.transaction([namespace], "readwrite");
    const objectStore = transaction.objectStore(namespace);
    const request = objectStore.put(value, subkey);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("unknown error setting value"));
    });
  }

  /** @override */
  async delete(namespace: string, subkey: string) {
    const db = await this.db;
    const transaction = db.transaction([namespace], "readwrite");
    const objectStore = transaction.objectStore(namespace);
    const request = objectStore.delete(subkey);
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("unknown error deleting value"));
    });
  }

  /** @override */
  async get(namespace: string, subkey: string) {
    const db = await this.db;
    const transaction = db.transaction([namespace], "readonly");
    const objectStore = transaction.objectStore(namespace);
    const request = objectStore.get(subkey);
    return await new Promise<string | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error ?? new Error("unknown error getting from IndexedDB storage"));
    });
  }

  /** @override */
  async list(namespace: string) {
    const db = await this.db;
    const transaction = db.transaction([namespace], "readonly");
    const objectStore = transaction.objectStore(namespace);
    const request = objectStore.getAllKeys();
    return await new Promise<string[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result.map((key) => String(key)));
      request.onerror = () => reject(request.error ?? new Error("unknown error listing IndexedDB storage"));
    });
  }
}
