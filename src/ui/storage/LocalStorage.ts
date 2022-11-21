import { Storage } from "./Storage";

export class LocalStorage extends Storage {
  constructor(private localStorage: Window["localStorage"]) {
    super();
  }

  set(namespace: string, subkey: string, value: string): void {
    this.localStorage.setItem(`${namespace}/${subkey}`, value);
  }

  delete(namespace: string, subkey: string): void {
    return this.localStorage.removeItem(`${namespace}/${subkey}`);
  }

  get(namespace: string, subkey: string): string | null {
    return this.localStorage.getItem(`${namespace}/${subkey}`);
  }

  list(namespace: string): string[] {
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
