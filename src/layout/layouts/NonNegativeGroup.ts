import types from "..";
import { AbstractGroup } from "./AbstractGroup";

/**
 * A group that lays out its children such that all x/y coordinates are non-negative.
 *
 * This is achieved by offsetting all children by the top-left (x,y) corner of the bounding box of all children.
 */
export class NonNegativeGroup<T extends types.LayoutElement> extends AbstractGroup<T> {
  readonly type = "Group";

  addElement(element: T) {
    element.parent = this;
    this.box = this.box.encompass(element.box);
    this.children.push(element);
  }

  reset() {
    super.reset();
    this.box.x = 0;
    this.box.y = 0;
  }

  /**
   * Lay out the children.
   *
   * If this box's top left corner isn't at the origin, translate all children and this box to the origin.
   */
  layout() {
    if (this.box.x === 0 && this.box.y === 0) {
      return;
    }

    for (const element of this.children) {
      element.layout?.();
      element.box = element.box.translate(-this.box.x, -this.box.y);
    }

    this.box.x = -this.box.x;
    this.box.y = -this.box.y;
  }
}
