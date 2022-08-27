import { blobToDataURI, dataURItoBlob } from "./utils";

export abstract class Storage {
  abstract set(namespace: string, subkey: string, value: string): void;
  abstract get(namespace: string, subkey: string): string | null;
  abstract list(namespace: string): string[];

  setBlob(namespace: string, subkey: string, blob: Blob): void {
    void blobToDataURI(blob).then((value) => {
      this.set(namespace, subkey, value);
    });
  }

  getBlob(namespace: string, subkey: string): Blob | null {
    const value = this.get(namespace, subkey);
    return value ? dataURItoBlob(value) : null;
  }
}
