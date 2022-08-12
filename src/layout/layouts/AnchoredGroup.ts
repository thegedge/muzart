import { zip } from "lodash";
import types from "..";
import { AbstractGroup } from "./AbstractGroup";

/**
 * A group that anchors its child elements to other elements.
 *
 * **Note**: Currently anchors only to the top-left corner of the anchor element.
 */
export class AnchoredGroup<T extends types.LayoutElement, AnchorT extends types.HasBox> extends AbstractGroup<T> {
  readonly type = "Group";
  readonly align = "end";
  readonly anchors: (AnchorT | null)[] = [];

  /**
   * Add an element that positions itself to another, known as "anchoring".
   *
   * If no anchor element given, the element will simply be positioned as normal.
   *
   * @param element the element to be laid out
   * @param anchor the element to anchor to
   */
  addElement(element: T, anchor: AnchorT | null) {
    element.parent = this;
    this.children.push(element);
    this.anchors.push(anchor);
  }

  reset() {
    super.reset();
    this.anchors.length = 0;
  }

  /**
   * Lay out this group's children.
   *
   * The children will use the current `box` of their respective anchor elements, so it's important to have the anchor
   * elements already laid out before calling this function.
   */
  layout() {
    for (const child of this.children) {
      child.layout?.();
      this.box = this.box.encompass(child.box);
    }

    for (const [child, anchor] of zip(this.children, this.anchors)) {
      if (child) {
        child.box.x = anchor ? anchor.box.x : 0;
        child.box.y = this.align === "end" ? this.box.height - child.box.height : 0;
      }
    }
  }
}
