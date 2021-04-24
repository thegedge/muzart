import { HasBox, Wrapped } from "../types";
import Box from "../utils/Box";
import { MaybeLayout } from "./types";

/**
 * A group that stacks its elements vertically.
 */
export class StackedGroup<T extends MaybeLayout<HasBox>> {
  readonly type: "Group" = "Group";
  readonly elements: Wrapped<T>[] = [];

  constructor(readonly spacing = 0, readonly box = new Box(0, 0, 0, 0)) {}

  /**
   * Add an element that positions itself to another, known as "anchoring".
   *
   * If no anchor element given, the element will simply be positioned as normal.
   *
   * @param element the element to be laid out
   * @param anchor the element to anchor to
   */
  addElement(element: T) {
    this.elements.push({
      type: "Wrapped",
      element,
      box: new Box(0, 0, 0, 0),
    });
  }

  reset() {
    this.elements.splice(0);
    this.box.width = 0;
    this.box.height = 0;
  }

  /**
   * Lay out the elements in this group.
   *
   * The elements will use the current `box` of their respective anchor elements, so it's important to have the anchor
   * elements already laid out before calling this function.
   */
  layout() {
    let first = true;
    for (const wrapped of this.elements) {
      if (wrapped.element.layout) {
        wrapped.element.layout();
      }

      const spacing = first ? 0 : this.spacing;
      first = false;

      wrapped.box.y = this.box.height + spacing;
      wrapped.box.width = wrapped.element.box.width;
      wrapped.box.height = wrapped.element.box.height;

      this.box.height += wrapped.box.height + spacing;
      this.box.width = Math.max(this.box.width, wrapped.box.width);
    }
  }
}
