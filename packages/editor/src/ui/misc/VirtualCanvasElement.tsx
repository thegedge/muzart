import { CanvasState } from "@muzart/canvas";
import { type AnyLayoutElement, Box, toAncestorCoordinateSystem } from "@muzart/layout";

/**
 * Represents an element in the canvas as a virtual DOM element.
 */
export class VirtualCanvasElement {
  readonly element: AnyLayoutElement;
  readonly canvas: CanvasState;

  constructor(element: AnyLayoutElement, canvas: CanvasState) {
    this.element = element;
    this.canvas = canvas;
  }

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
