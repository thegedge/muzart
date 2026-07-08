import { SyncStorage } from "./Storage";

export class LocalStorage extends SyncStorage {
  private localStorage: Storage;

  constructor(localStorage = globalThis.localStorage) {
    super();
    this.localStorage = localStorage;
  }

  /** @override */
  set(namespace: string, subkey: string, value: string) {
    this.localStorage.setItem(`${namespace}/${subkey}`, value);
  }

  /** @override */
  delete(namespace: string, subkey: string) {
    this.localStorage.removeItem(`${namespace}/${subkey}`);
  }

  /** @override */
  get(namespace: string, subkey: string) {
    return this.localStorage.getItem(`${namespace}/${subkey}`);
  }

  /** @override */
  list(namespace: string) {
    const files = [];
    for (let index = 0; index < this.localStorage.length; ++index) {
      const key = this.localStorage.key(index);
      if (!key) {
        continue;
      }

      const [prefix, subkey] = key.split("/", 2);
      if (prefix == namespace && subkey) {
        files.push(subkey);
      }
    }

    return files;
  }
}
