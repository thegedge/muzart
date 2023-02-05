import { blobToDataURI, dataURItoBlob } from "./utils";

export interface StorableObject {
  toJSON(): Record<string, unknown>;
  fromJSON(value: Record<string, unknown>): void;
}

export type Storage = SyncStorage | AsyncStorage;

export abstract class SyncStorage {
  /** Set a value in this storage instance */
  abstract set(namespace: string, subkey: string, value: string): void;

  /** Get the raw string value in this storage instance */
  abstract get(namespace: string, subkey: string): string | null;

  /** Delete a given value from storage */
  abstract delete(namespace: string, subkey: string): void;

  /** List all keys in the given namespace */
  abstract list(namespace: string): string[];

  /** Store a blob or storable object in this storage instance */
  async store(namespace: string, subkey: string, object: Blob | StorableObject): Promise<void> {
    let value: string;
    if (object instanceof Blob) {
      value = await blobToDataURI(object);
    } else {
      value = JSON.stringify(object.toJSON());
    }
    this.set(namespace, subkey, value);
  }

  /** Load a storable object from this storage instance */
  loadObject<T extends StorableObject>(namespace: string, subkey: string, object: T): void {
    const value = this.get(namespace, subkey);
    if (!value) {
      return;
    }

    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed != "object") {
      return;
    }

    object.fromJSON(parsed as Record<string, unknown>);
  }

  /** Load a blob rom this storage instance */
  loadBlob(namespace: string, subkey: string): Blob | null {
    const value = this.get(namespace, subkey);
    return value ? dataURItoBlob(value) : null;
  }
}

export abstract class AsyncStorage {
  /** Set a value in this storage instance */
  abstract set(namespace: string, subkey: string, value: string): Promise<void>;

  /** Get the raw string value in this storage instance */
  abstract get(namespace: string, subkey: string): Promise<string | null>;

  /** Delete a given value from storage */
  abstract delete(namespace: string, subkey: string): Promise<void>;

  /** List all keys in the given namespace */
  abstract list(namespace: string): Promise<string[]>;

  /** Store a blob or storable object in this storage instance */
  async store(namespace: string, subkey: string, object: Blob | StorableObject): Promise<void> {
    let value: string;
    if (object instanceof Blob) {
      value = await blobToDataURI(object);
    } else {
      value = JSON.stringify(object.toJSON());
    }
    await this.set(namespace, subkey, value);
  }

  /** Load a storable object from this storage instance */
  async loadObject<T extends StorableObject>(namespace: string, subkey: string, object: T): Promise<void> {
    const value = await this.get(namespace, subkey);
    if (!value) {
      return;
    }

    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed != "object") {
      return;
    }

    object.fromJSON(parsed as Record<string, unknown>);
  }

  /** Load a blob rom this storage instance */
  async loadBlob(namespace: string, subkey: string): Promise<Blob | null> {
    const value = await this.get(namespace, subkey);
    return value ? dataURItoBlob(value) : null;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value == "object" && !!value;
};

export const numberOrDefault = (value: unknown, defaultValue: number): number => {
  return typeof value == "number" ? value : defaultValue;
};
