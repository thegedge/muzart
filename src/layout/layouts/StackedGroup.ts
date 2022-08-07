import types from "..";
import { Wrapped } from "../elements/Wrapped";
import { Box } from "../utils/Box";
import { AbstractGroup } from "./AbstractGroup";

/**
 * A group that stacks its elements vertically.
 */
export class StackedGroup<T extends types.LayoutElement> extends AbstractGroup<Wrapped<T>> {
  readonly type = "Group";

  constructor(readonly spacing = 0, box = new Box(0, 0, 0, 0)) {
    super(box);
  }

  /**
   * Add an element that positions itself to another, known as "anchoring".
   *
   * If no anchor element given, the element will simply be positioned as normal.
   *
   * @param element the element to be laid out
   */
  addElement(element: T) {
    const wrapped = new Wrapped(element);
    wrapped.parent = this;
    this.children.push(wrapped);
  }

  /**
   * Lay out the elements in this group.
   *
   * The elements will use the current `box` of their respective anchor elements, so it's important to have the anchor
   * elements already laid out before calling this function.
   */
  layout() {
    let spacing = 0;
    for (const wrapped of this.children) {
      wrapped.layout();
      wrapped.box.y = this.box.height + spacing;
      wrapped.box.width = wrapped.element.box.width;
      wrapped.box.height = wrapped.element.box.height;

      this.box.height += wrapped.box.height + spacing;
      this.box.width = Math.max(this.box.width, wrapped.box.width);

      spacing = this.spacing;
    }
  }
}
