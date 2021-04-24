export interface Layout {
  layout(): void;
}

export type MaybeLayout<T> = T & Partial<Layout>;
