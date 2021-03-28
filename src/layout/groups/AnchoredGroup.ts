import { zip } from "lodash";
import { HasBox, Wrapped } from "../types";
import Box from "../utils/Box";
import { MaybeLayout } from "./types";

/**
 * A group that anchors its child elements to other elements.
 *
 * **Note**: Currently anchors only to the top-left corner of the anchor element.
 */
export class AnchoredGroup<T extends MaybeLayout<HasBox>, AnchorT extends HasBox> {
  readonly type: "Group" = "Group";
  readonly align = "end";
  public elements: Wrapped<T>[] = [];
  public anchors: (AnchorT | null | undefined)[] = [];

  constructor(public box = new Box(0, 0, 0, 0)) {}

  /**
   * Add an element that positions itself to another, known as "anchoring".
   *
   * If no anchor element given, the element will simply be positioned as normal.
   *
   * @param element the element to be laid out
   * @param anchor the element to anchor to
   */
  addElement(element: T, anchor: AnchorT) {
    // TODO if no anchor, instead of wrapping, just use the element as is

    this.elements.push({
      type: "Wrapped",
      element,
      box: new Box(0, 0, 0, 0),
    });
    this.anchors.push(anchor);
  }

  reset() {
    this.anchors = [];
    this.elements = [];
    this.box = new Box(0, 0, 0, 0);
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
