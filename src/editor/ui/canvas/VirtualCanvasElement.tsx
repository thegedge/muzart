import { AnyLayoutElement, Box, toAncestorCoordinateSystem } from "../../../layout";
import { CanvasState } from "./CanvasState";

/**
 * Represents an element in the canvas as a virtual DOM element.
 */
export class VirtualCanvasElement {
  constructor(
    readonly element: AnyLayoutElement,
    readonly canvas: CanvasState,
  ) {}

  /**
   * A `DOMRect`-like object for this box.
   */
  getBoundingClientRect() {
    if (this.canvas.canvas === null) {
      return Box.empty();
    }

    const box = toAncestorCoordinateSystem(this.element);
    const canvasViewportBox = this.canvas.userSpaceToCanvasViewport(box);
    const canvasBoundingRect = this.canvas.canvas.getBoundingClientRect();
    return canvasViewportBox.translate(canvasBoundingRect.x, canvasBoundingRect.y);
  }
}
