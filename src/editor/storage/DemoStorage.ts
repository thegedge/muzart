import { AsyncStorage } from "./Storage";
import { TABS_NAMESPACE } from "./namespaces";

export class DemoStorage extends AsyncStorage {
  constructor(readonly urls: string[]) {
    super();
  }

  /** @override */
  async loadBlob(namespace: string, subkey: string) {
    if (namespace != TABS_NAMESPACE) {
      throw new Error(`Unknown demo namespace: ${namespace}`);
    }

    const url = new URL(`${import.meta.env.BASE_URL}songs/${subkey}`, import.meta.url);
    const response = await fetch(url);
    return await response.blob();
  }

  /** @override */
  async get(_namespace: string, _subkey: string): Promise<string | null> {
    throw new Error("Can't get demo tabs");
  }

  /** @override */
  async delete(_namespace: string, _subkey: string) {
    throw new Error("Can't delete demo tabs");
  }

  /** @override */
  async set(_namespace: string, _subkey: string, _value: string) {
    throw new Error("Can't store demo tabs");
  }

  /** @override */
  async list(namespace: string) {
    return namespace == TABS_NAMESPACE ? this.urls : [];
  }
}
