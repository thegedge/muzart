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
