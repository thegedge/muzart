/** A type that is either itself or an array of itself */
export type MaybeArray<T> = T | T[];

type Digits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Decrement<N extends Digits> = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8][N];

/** A union of all possible paths to a property of a given type */
export type PropertyPaths<T, N extends Digits> = N extends 0
  ? never
  : {
      [K in keyof T & string]: T[K] extends object ? K | `${K}.${PropertyPaths<T[K], Decrement<N>>}` : K;
    }[keyof T & string];
