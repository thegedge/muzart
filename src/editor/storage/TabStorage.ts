/* eslint-disable @typescript-eslint/no-unnecessary-condition -- loaders[x] is always defined, but it may not be (easier to ignore than do some other things) */
import { AsyncStorage } from "./Storage";
import { TABS_NAMESPACE } from "./namespaces";

/**
 * Storage for tabs.
 *
 * Abstracts over {@see AsyncStorage}, giving a few nice features on top of storing tabs:
 * 1. Store metadata alongside tabs
 * 2. Combine multiple async storages
 * 3. Present a filesystem like view
 */
export class TabStorage {
  constructor(private loaders: Record<string, AsyncStorage>) {}

  async load(url: URL): Promise<Blob | null> {
    const scheme = url.protocol.slice(0, -1);
    const loader = this.loaders[scheme];
    if (!loader) {
      throw new Error(`unknown protocol for tab storage: ${scheme}`);
    }

    return await loader.loadBlob(TABS_NAMESPACE, url.pathname);
  }

  async store(url: URL, blob: Blob): Promise<void> {
    const scheme = url.protocol.slice(0, -1);
    const loader = this.loaders[scheme];
    if (!loader) {
      throw new Error(`unknown protocol for tab storage: ${scheme}`);
    }

    await loader.store(TABS_NAMESPACE, url.pathname, blob);
  }

  async delete(url: URL): Promise<void> {
    const scheme = url.protocol.slice(0, -1);
    const loader = this.loaders[scheme];
    if (!loader) {
      throw new Error(`unknown loader type: ${scheme}`);
    }

    await loader.delete(TABS_NAMESPACE, url.pathname);
  }

  async list(): Promise<URL[]> {
    const listings = await Promise.all(
      Object.entries(this.loaders).map(async ([scheme, loader]) => {
        const tabs = await loader.list(TABS_NAMESPACE);
        return tabs.map((tab) => new URL(`${scheme}:${tab}`));
      }),
    );
    return listings.flatMap((listing) => listing);
  }
}
