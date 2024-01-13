import layout from ".";
import { Point } from "./utils";

export interface Hit<T> {
  /** The thing that was hit with a hit test */
  element: T;

  /** The hit point, relative to the element that was hit */
  point: Point;
}

export const hitTest = (point: Point, element: layout.AllElements | undefined): Hit<layout.AllElements> | null => {
  if (!element?.box.contains(point)) {
    return null;
  }

  if ("children" in element && element.children.length > 0) {
    const adjustedPoint = { x: point.x - element.box.x, y: point.y - element.box.y };
    for (const child of element.children) {
      const hit = hitTest(adjustedPoint, child);
      if (hit) {
        return hit;
      }
    }
  }

  if (element.type == "Group") {
    return null;
  }

  return { element, point };
};
