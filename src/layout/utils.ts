/**
 * Compute the max of a collection after being mapped by a function.
 *
 * This is roughly equivalent to the following lodash options:
 *
 * ```js
 * max(map(collection, mapper))
 * mapper(maxBy(collection, mapper))
 * ```
 *
 * The first creates an intermediate array, which is undesirable for performance.
 * The second is better, but requires the mapper to deal with `undefined`, and will map the max value twice.
 *
 * @param collection
 * @param mapper a mapping function
 * @param lessThan an optional comparator that checks if the first arg is less than the second
 *
 * @returns `undefined` if the array is empty, otherwise the max value in the
 */
export function maxMap<T, MaxT>(
  collection: Iterable<T>,
  mapper: (v: T) => MaxT,
  lessThan: (a: MaxT, b: MaxT) => boolean = (a, b) => a < b
): MaxT | undefined {
  let maxValue: MaxT | undefined;
  for (const v of collection) {
    const value = mapper(v);
    if (maxValue === undefined) {
      maxValue = value;
    } else if (lessThan(maxValue, value)) {
      maxValue = value;
    }
  }
  return maxValue;
}

/**
 * Efficient computation for the number of characters to display the given number.
 *
 * @example
 * numCharsToRepresent(0)     // 1
 * numCharsToRepresent(1337)  // 4
 * numCharsToRepresent(-14)   // 3
 *
 * @returns the number of characters to represent the number, equivalent to `number.toString().length`
 */
export function numCharsToRepresent(v: number): number {
  let num = 1;
  if (v > 0) {
    v = -v;
    num += 1;
  }

  while (v >= 10) {
    v /= 10;
    num += 1;
  }

  return num;
}

/**
 * Find runs of elements in a bigger list.
 *
 * @param values the list of value sto find runs in
 * @param partOfRun a function that determines if a given element should be part of a run
 *
 * @returns a list of `[start, end]` tuples for all the runs in the given list
 *
 * @example
 * runs([0, 1, 2, 4, 3, 5, 7, 1, 4, 14], (v) => v % 2 == 0) == [[0, 0], [2, 3], [8, 9]]
 */
export function runs<T>(values: Iterable<T>, partOfRun: (v: T) => boolean): [number, number][] {
  const runs: [number, number][] = [];
  let start: number | null = null;
  let index = 0;
  for (const v of values) {
    if (partOfRun(v)) {
      start ??= index;
    } else if (start !== null) {
      runs.push([start, index - 1]);
      start = null;
    }

    ++index;
  }

  if (start !== null) {
    runs.push([start, index - 1]);
  }

  return runs;
}
