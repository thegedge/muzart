import Box from "./Box";
import { HasBox } from "./types";

/**
 * A group that lays out its elements such that all x/y coordinates are non-negative.
 *
 * This is achieved by offsetting all elements by the top-left (x,y) corner of the bounding box of all elements.
 */
export class NonNegativeGroup<T extends HasBox> {
  readonly type: "Group" = "Group";

  public elements: T[] = [];

  constructor(public box = new Box(0, 0, 0, 0)) {}

  addElement(element: T) {
    this.box = this.box.encompass(element.box);
    this.elements.push(element);
  }

  reset() {
    this.elements = [];
    this.box = new Box(0, 0, 0, 0);
  }

  /**
   * Lay out the elements.
   *
   * If this box's top left corner isn't at the origin, translate all elements and this box to the origin.
   */
  layout() {
    if (this.box.x === 0 && this.box.y === 0) {
      return;
    }

    for (const element of this.elements) {
      element.box = element.box.translate(-this.box.x, -this.box.y);
    }

    this.box = this.box.inverse();
  }
}
