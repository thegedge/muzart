import { zip } from "lodash";
import { wrap } from "../elements/Wrapped";
import { HasBox, LayoutElement, Wrapped } from "../types";
import { AbstractGroup as AbstractGroup } from "./AbstractGroup";
import { MaybeLayout } from "./types";

/**
 * A group that anchors its child elements to other elements.
 *
 * **Note**: Currently anchors only to the top-left corner of the anchor element.
 */
export class AnchoredGroup<T extends MaybeLayout<LayoutElement>, AnchorT extends HasBox> extends AbstractGroup<
  Wrapped<T>
> {
  readonly type = "Group";
  readonly align = "end";
  public anchors: (AnchorT | null | undefined)[] = [];

  /**
   * Add an element that positions itself to another, known as "anchoring".
   *
   * If no anchor element given, the element will simply be positioned as normal.
   *
   * @param element the element to be laid out
   * @param anchor the element to anchor to
   */
  addElement(element: T, anchor: AnchorT | null | undefined) {
    // TODO if no anchor, instead of wrapping, just use the element as is
    const wrapped = wrap(element);
    wrapped.parent = this;
    this.elements.push(wrapped);
    this.anchors.push(anchor);
  }

  reset() {
    super.reset();
    this.anchors = [];
  }

  /**
   * Lay out the elements in this group.
   *
   * The elements will use the current `box` of their respective anchor elements, so it's important to have the anchor
   * elements already laid out before calling this function.
   */
  layout() {
    for (const wrapped of this.elements) {
      if (wrapped.element.layout) {
        wrapped.element.layout();
      }

      this.box = this.box.encompass(wrapped.element.box);
      wrapped.box.width = wrapped.element.box.width;
      wrapped.box.height = wrapped.element.box.height;
    }

    for (const [wrapped, anchor] of zip(this.elements, this.anchors)) {
      if (wrapped) {
        wrapped.box.x = anchor ? anchor.box.x : 0;
        wrapped.box.y = this.align === "end" ? this.box.height - wrapped.box.height : 0;
      }
    }
  }
}
