import { makeAutoObservable } from "mobx";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";
import { Point, RenderFunction, scrollWithClamping } from "./Canvas";

/**
 * Manages the canvas state, translating between various coordinate spaces:
 *
 * 1. user space; the space in which the rendering occurs,
 * 2. canvas space; the space in which mouse events are created, and
 * 3. device space; the space in which rendering is performed (canvas space * pixel ratio)
 */
export class CanvasState {
  canvas: HTMLCanvasElement | null = null;

  /** The zoom level, a linear scaling factor applied to the entire canvas */
  zoom = 1;

  /** The actual device pixel ratio */
  pixelRatio = devicePixelRatio;

  /** The viewport, in userspace coordinates */
  viewport = Box.empty();

  /** The handle of the last request animation frame */
  frameHandle = -1;

  /** The horizontal scroll offset, in canvas space */
  scrollX = 0;

  /** The vertical scroll offset, in canvas space */
  scrollY = 0;

  /** The cursor to show for the canvas */
  cursor = "auto";

  /** The size of the user coordinate space */
  userSpaceSize = Box.empty();

  /** The function to call when a redraw needs to occur */
  render: RenderFunction = () => void 0;

  constructor() {
    makeAutoObservable(this, {});
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    const center = this.canvas == null;
    this.canvas = canvas;
    this.updateCanvas();
    if (center) {
      this.centerViewport();
    }
  }

  setCursor(cursor: this["cursor"]) {
    this.cursor = cursor;
  }

  setUserSpaceSize(size: Box) {
    this.userSpaceSize = size;
    this.updateViewport();
  }

  setRenderFunction(f: RenderFunction) {
    this.render = f;
    this.redraw();
  }

  setZoom(zoom: number) {
    const canvasHalfWidth = (0.5 * (this.canvas?.width ?? 0)) / this.pixelRatio;
    const canvasHalfHeight = (0.5 * (this.canvas?.height ?? 0)) / this.pixelRatio;
    this.zoomCenteredOn(zoom, canvasHalfWidth, canvasHalfHeight);
  }

  zoomCenteredOn(zoom: number, mouseX: number, mouseY: number) {
    const newZoom = Math.max(0.1, Math.min(5, zoom));
    if (newZoom == this.zoom) {
      return;
    }

    this.scrollX = (newZoom / this.zoom) * (this.scrollX + mouseX) - mouseX;
    this.scrollY = (newZoom / this.zoom) * (this.scrollY + mouseY) - mouseY;
    this.zoom = newZoom;
    this.updateViewport();
  }

  setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
    this.updateCanvas();
  }

  centerViewport() {
    if (this.canvas) {
      const canvasSpaceWidth = this.canvasSpaceSize.width;
      const width = this.canvas.width / this.pixelRatio;
      if (canvasSpaceWidth < width) {
        this.scrollX = -0.5 * (width - canvasSpaceWidth);
      }
      this.updateViewport();
    }
  }

  updateCanvas() {
    if (this.canvas) {
      const canvasRect = this.canvas.getBoundingClientRect();
      this.canvas.width = canvasRect.width * this.pixelRatio;
      this.canvas.height = canvasRect.height * this.pixelRatio;
    }
    this.updateViewport();
  }

  scrollBy(deltaX: number, deltaY: number) {
    if (!this.canvas) {
      return false;
    }

    this.scrollTo(this.scrollX + deltaX, this.scrollY + deltaY);
  }

  scrollTo(x: number, y: number) {
    if (!this.canvas) {
      return;
    }

    const pageW = this.canvas.width / this.pixelRatio;
    const pageH = this.canvas.height / this.pixelRatio;

    let lowerX = 0;
    let upperX = this.canvasSpaceSize.width - pageW;
    const canvasSpaceWidth = this.canvasSpaceSize.width;
    const canvasSpaceViewportWidth = this.canvas.width / this.pixelRatio;
    if (canvasSpaceWidth < canvasSpaceViewportWidth) {
      lowerX = -0.5 * (canvasSpaceViewportWidth - canvasSpaceWidth);
      upperX = lowerX + canvasSpaceWidth - pageW;
    }

    this.scrollX = scrollWithClamping(this.scrollX, x, lowerX, upperX);
    this.scrollY = scrollWithClamping(this.scrollY, y, 0, this.canvasSpaceSize.height - pageH);

    this.updateViewport();
  }

  ensureInView(userSpaceBox: Box) {
    if (!this.canvas) {
      return;
    }

    if (this.viewport.contains(userSpaceBox)) {
      return;
    }

    // TODO (maybe) depending on which direction we need to scroll, change how we decide to scroll. For example,
    //  when scrolling downwards, show an entire page after the given box, instead of centering.

    const x = (userSpaceBox.centerX - 0.5 * this.viewport.width) * this.userspaceToCanvasFactor;
    const y = (userSpaceBox.centerY - 0.5 * this.viewport.height) * this.userspaceToCanvasFactor;
    this.scrollTo(x, y);
  }

  updateViewport() {
    if (!this.canvas) {
      return;
    }

    // Ensure the scroll values are clamped
    const pageW = this.canvas.width / this.pixelRatio;
    const pageH = this.canvas.height / this.pixelRatio;
    this.scrollX = Math.max(-pageW, Math.min(this.scrollX, this.canvasSpaceSize.width));
    this.scrollY = Math.max(-pageH, Math.min(this.scrollY, this.canvasSpaceSize.height));

    const { x, y } = this.canvasViewportToUserSpace({ x: 0, y: 0 });

    this.viewport = new Box(
      x,
      y,
      this.canvas.width / this.userspaceToDeviceFactor,
      this.canvas.height / this.userspaceToDeviceFactor
    );
    this.redraw();
  }

  canvasViewportToUserSpace(pt: Point): Point {
    if (!this.canvas) {
      return pt;
    }

    return {
      x: (this.scrollX + pt.x) / this.userspaceToCanvasFactor,
      y: (this.scrollY + pt.y) / this.userspaceToCanvasFactor,
    };
  }

  get canvasSpaceSize() {
    return new Box(
      0,
      0,
      this.userSpaceSize.width * this.userspaceToCanvasFactor,
      this.userSpaceSize.height * this.userspaceToCanvasFactor
    );
  }

  get userspaceToCanvasFactor() {
    return this.zoom * PX_PER_MM;
  }

  get userspaceToDeviceFactor() {
    return this.userspaceToCanvasFactor * this.pixelRatio;
  }

  redraw() {
    if (!this.canvas || !this.viewport) {
      return;
    }

    const context = this.canvas.getContext("2d", { willReadFrequently: false });
    if (!context) {
      return;
    }

    cancelAnimationFrame(this.frameHandle);

    this.frameHandle = requestAnimationFrame((_time) => {
      if (!this.canvas) {
        return;
      }

      const factor = this.zoom * this.pixelRatio * PX_PER_MM;
      context.setTransform(factor, 0, 0, factor, -this.viewport.x * factor, -this.viewport.y * factor);
      context.clearRect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
      context.lineWidth = LINE_STROKE_WIDTH;
      this.render(context, this.viewport);
    });
  }
}
