import type { AnyLayoutElement } from "../elements/LayoutElement";
import { Box } from "./Box";

export { Box } from "./Box";

/**
 * Get an ancestor of a given type for an element.
 */
export function ancestorOfType<AncestorT extends AnyLayoutElement>(
  source: AnyLayoutElement,
  ancestorType: AncestorT["type"],
): AncestorT | null {
  let e: AnyLayoutElement | null = source.parent;
  while (e && e.type != ancestorType) {
    e = e.parent;
  }
  return e as AncestorT | null;
}

/**
 * Move the box of a given element into an ancestor's coordinate system.
 *
 * If no ancestor given, or the ancestor is not found, the absolute coordinates of the element's box will be returned.
 *
 * @param ancestorType type of ancestor element whose coordinate system to map into
 */
export function toAncestorCoordinateSystem<LayoutT extends AnyLayoutElement>(
  source: LayoutT,
  ancestorType?: LayoutT["type"],
): Box {
  const box = source.box.clone();
  let e: AnyLayoutElement | null | undefined = source.parent;
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
  lessThan: (a: MinT, b: MinT) => boolean = (a, b) => a < b,
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
  lessThan: (a: MaxT, b: MaxT) => boolean = (a, b) => a < b,
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
 * numCharsToRepresent(0) == 1
 * numCharsToRepresent(1337) == 4
 * numCharsToRepresent(-14) == 3
 *
 * @returns the number of characters to represent the number, equivalent to `number.toString().length`
 */
export const numCharsToRepresent = (v: number): number => {
  let num = 1;
  if (v < 0) {
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
 * @param values the list of values to find runs in
 * @param mapper a function that maps a given element to a run value. It is compared against the
 *   previously mapped value. If they are the same, the make up a run. If it is undefined, stop
 *   any current run but don't start a new one.
 *
 * @returns a list of `[start, end]` indexes for all the runs in the given list, `end` being inclusive
 *
 * * @example
 * runs([0, 1, 2, 4, 3, 5, 7, 1, 4, 14], (v) => v % 2 == 0) == [[0, 0], [1, 1], [2, 3], [4, 7], [8, 9]]
 *
 * @example
 * runs([0, 1, 2, 4, 3, 5, 7, 1, 4, 14], (v) => v % 2 == 0 ? true : undefined) == [[0, 0], [2, 3], [8, 9]]
 *
 * @example
 * runs([1, 2, 2, 3, 3, 3, 4], (v) => v) == [[0, 0], [1, 2], [3, 5], [6, 6]]
 */
export function runs<T, V>(
  values: Iterable<T>,
  mapper: (v: T, lastValue: V | undefined) => V | undefined,
): [number, number, V][] {
  const runs: [number, number, V][] = [];
  let mapped: V | undefined = undefined;
  let start: number | null = null;
  let index = 0;
  for (const v of values) {
    const newMapped = mapper(v, mapped);
    const endCurrentRun = newMapped == undefined || newMapped != mapped;
    if (endCurrentRun && start !== null && mapped !== undefined) {
      runs.push([start, index - 1, mapped]);
      start = null;
      mapped = undefined;
    }

    if (mapped == undefined && newMapped != undefined) {
      start = index;
      mapped = newMapped;
    }

    ++index;
  }

  if (start !== null && mapped !== undefined) {
    runs.push([start, index - 1, mapped]);
  }

  return runs;
}

/**
 * Find the ancestor element of a given type.
 *
 * @returns The element whose `type` matches the given `type`. If `e` itself is of the given type, `e` will be returned.
 */
export const getAncestorOfType = <T extends AnyLayoutElement>(e: AnyLayoutElement, type: string): T | null => {
  let current: AnyLayoutElement | null = e;
  while (current) {
    if (current.type == type) {
      return current as T;
    }
    current = current.parent;
  }
  return current;
};

/**
 * Whether or not a given element is an ancestor of another.
 *
 * @returns `true` if `element` is an ancestor of `maybeDescendantElement`, `false` otherwise.
 */
export const isAncestor = (element: AnyLayoutElement, maybeDescendantElement: AnyLayoutElement): boolean => {
  let current: AnyLayoutElement | undefined | null = maybeDescendantElement;
  while (current) {
    if (current === element) {
      return true;
    }
    current = current.parent;
  }
  return false;
};
