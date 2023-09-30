import layout from ".";
import { Hit } from "../editor/state/Application";
import { Point } from "./utils";

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
