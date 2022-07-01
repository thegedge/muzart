import { makeAutoObservable } from "mobx";

export class Application {
  public buffer: ArrayBuffer | null = null;
  public loading = false;
  public error: Error | null = null;

  public page = 0;

  constructor() {
    makeAutoObservable(this, undefined, { deep: false, proxy: false });
  }

  setPage(page: number) {
    this.page = page;
  }

  loadFromFile(file: File | null) {
    this.error = null;
    if (file) {
      this.loading = true;
      void file
        .arrayBuffer()
        .then((b) => (this.buffer = b))
        .catch((error) => {
          this.error = error;
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      this.buffer = null;
    }
  }
}
