import type { AnyLayoutElement } from "./elements/LayoutElement";
import { AbstractGroup } from "./layouts/AbstractGroup";
import type { Point } from "./utils/Box";

export interface Hit<T> {
  /** The thing that was hit with a hit test */
  element: T;

  /** The hit point, relative to the element that was hit */
  point: Point;
}

/**
 * Find the innermost descendant of a given element that is at the given point.
 *
 * @template ElementT A union of the given element type and all possible descendant element types
 * @returns The innermost descendant of the given element that contains the given point, or `null` if no such element exists.
 */
export const hitTest = <ElementT extends AnyLayoutElement>(
  point: Point,
  element: ElementT | null | undefined,
): Hit<ElementT> | null => {
  if (!element?.box.contains(point)) {
    return null;
  }

  if (element.children?.length) {
    const adjustedPoint = { x: point.x - element.box.x, y: point.y - element.box.y };
    for (let index = element.children.length - 1; index >= 0; --index) {
      const child = element.children[index];
      const hit = hitTest<ElementT>(adjustedPoint, child as ElementT);
      if (hit) {
        return hit;
      }
    }
  }

  if (element instanceof AbstractGroup) {
    return null;
  }

  return { element, point };
};
