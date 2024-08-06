export type T = T extends { new (...args: any): any } ? Omit<T, "new"> & { new (...args: never): never } : T;
