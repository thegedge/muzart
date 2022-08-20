import { LayoutElement } from "../types";
import { Box } from "./Box";

export * from "./Box";

/**
 * Get an ancestor of a given type for an element.
 */
export function ancestorOfType<LayoutT extends LayoutElement>(
  source: LayoutT,
  ancestorType: LayoutT["type"]
): LayoutElement | null {
  let e: LayoutElement | null | undefined = source.parent;
  while (e && e.type != ancestorType) {
    e = e.parent;
  }
  return e ?? null;
}

/**
 * Move the box of a given element into an ancestor's coordinate system.
 *
 * If no ancestor given, or the ancestor is not found, the absolute coordinates of the element's box will be returned.
 *
 * @param ancestorType type of ancestor element whose coordinate system to map into
 */
export function toAncestorCoordinateSystem<LayoutT extends LayoutElement>(
  source: LayoutT,
  ancestorType?: LayoutT["type"]
): Box {
  const box = source.box.clone();
  let e: LayoutElement | null | undefined = source.parent;
  while (e && e.type != ancestorType) {
    box.x += e.box.x;
    box.y += e.box.y;
    e = e.parent;
  }

  // TODO this would be a lot simpler, and perhaps generally more useful, if boxes also had absolute coordinates
  return box;
}

/**
 * Compute the min of a collection after being mapped by a function.
 *
 * This is roughly equivalent to the following lodash options:
 *
 * ```js
 * min(map(collection, mapper))
 * mapper(minBy(collection, mapper))
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
export function minMap<T, MinT>(
  collection: Iterable<T>,
  mapper: (v: T) => MinT,
  lessThan: (a: MinT, b: MinT) => boolean = (a, b) => a < b
): MinT | undefined {
  let minValue: MinT | undefined;
  for (const v of collection) {
    const value = mapper(v);
    if (minValue === undefined) {
      minValue = value;
    } else if (lessThan(value, minValue)) {
      minValue = value;
    }
  }
  return minValue;
}

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
  collection: ReadonlyArray<T>,
  mapper: (v: T) => MaxT,
  lessThan: (a: MaxT, b: MaxT) => boolean = (a, b) => a < b
): MaxT | undefined {
  if (collection.length == 0) {
    return undefined;
  }

  let maxValue: MaxT | undefined = mapper(collection[0]);
  for (let index = 1; index < collection.length; ++index) {
    const value = mapper(collection[index]);
    if (lessThan(maxValue, value)) {
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
export const numCharsToRepresent = (v: number): number => {
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
};

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
