import { makeAutoObservable } from "mobx";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";
import { isRecord, numberOrDefault } from "../../storage/Storage";
import { Point, RenderFunction } from "./Canvas";

/**
 * Manages the canvas state, translating between various coordinate spaces:
 *
 * 1. user space; the space in which the rendering occurs,
 * 2. canvas space; the space in which mouse events are created, and
 * 3. device space; the space in which rendering is performed (canvas space * pixel ratio)
 */
export class CanvasState {
  /** The canvas element this state manages */
  canvas: HTMLCanvasElement | null = null;

  /** The zoom level, a linear scaling factor applied to the entire canvas */
  zoom = 1;

  /** The actual device pixel ratio */
  pixelRatio = devicePixelRatio;

  /** The viewport, in userspace coordinates */
  viewport = Box.empty();

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
    makeAutoObservable(this);
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    if (canvas === this.canvas) {
      return;
    }

    this.canvas = canvas;
    this.updateViewport();
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

  // TODO can we adjust viewport directly and not have a zoom property at all?

  setZoom(zoom: number) {
    const canvasHalfWidth = (0.5 * (this.canvas?.width ?? 0)) / this.pixelRatio;
    const canvasHalfHeight = (0.5 * (this.canvas?.height ?? 0)) / this.pixelRatio;
    this.zoomCenteredOn(zoom, canvasHalfWidth, canvasHalfHeight);
  }

  zoomCenteredOn(zoom: number, x: number, y: number) {
    const newZoom = Math.max(0.1, Math.min(5, zoom));
    if (newZoom == this.zoom) {
      return;
    }

    this.scrollX = (newZoom / this.zoom) * (this.scrollX + x) - x;
    this.scrollY = (newZoom / this.zoom) * (this.scrollY + y) - y;
    this.zoom = newZoom;
    this.updateViewport();
  }

  setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
    this.updateViewport();
  }

  centerViewportOn(): void;
  centerViewportOn(x: number, y: number): void;
  centerViewportOn(x?: number, y?: number): void {
    if (typeof x == "undefined" || typeof y == "undefined") {
      if (this.canvasSpaceSize.width < this.canvasWidth) {
        this.scrollX = -0.5 * (this.canvasWidth - this.canvasSpaceSize.width);
      }

      if (this.canvasSpaceSize.height < this.canvasHeight) {
        this.scrollY = 0;
      }
    } else {
      this.scrollX = x - 0.5 * this.canvasWidth;
      this.scrollY = y - 0.5 * this.canvasHeight;
    }

    this.updateViewport();
  }

  scrollBy(deltaX: number, deltaY: number) {
    this.scrollTo(this.scrollX + deltaX, this.scrollY + deltaY);
  }

  scrollTo(x: number, y: number) {
    const canvasSpaceWidth = this.canvasSpaceSize.width;
    const canvasSpaceViewportWidth = this.canvasWidth;
    if (canvasSpaceWidth < canvasSpaceViewportWidth) {
      this.scrollX = -0.5 * (canvasSpaceViewportWidth - canvasSpaceWidth);
    } else {
      this.scrollX = clamp(x, 0, canvasSpaceWidth - canvasSpaceViewportWidth);
    }

    const canvasSpaceHeight = this.canvasSpaceSize.height;
    const canvasSpaceViewportHeight = this.canvasHeight;
    if (canvasSpaceHeight < canvasSpaceViewportHeight) {
      this.scrollY = -0.5 * (canvasSpaceViewportHeight - canvasSpaceHeight);
    } else {
      this.scrollY = clamp(y, 0, canvasSpaceHeight - canvasSpaceViewportHeight);
    }

    this.updateViewport();
  }

  ensureInView(userSpaceBox: Box) {
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
    if (
      this.canvasWidth == 0 ||
      this.canvasHeight == 0 ||
      this.canvasSpaceSize.width == 0 ||
      this.canvasSpaceSize.height == 0
    ) {
      return;
    }

    // Ensure the scroll values are clamped
    this.scrollX = Math.max(-this.canvasWidth, Math.min(this.scrollX, this.canvasSpaceSize.width));
    this.scrollY = Math.max(-this.canvasHeight, Math.min(this.scrollY, this.canvasSpaceSize.height));

    const { x, y } = this.canvasViewportToUserSpace({ x: 0, y: 0 });
    this.viewport = new Box(
      x,
      y,
      this.canvasWidth / this.userspaceToCanvasFactor,
      this.canvasHeight / this.userspaceToCanvasFactor,
    );

    this.redraw();
  }

  userSpaceToCanvasViewport(box: Box) {
    return new Box(
      box.x * this.userspaceToCanvasFactor - this.scrollX,
      box.y * this.userspaceToCanvasFactor - this.scrollY,
      box.width * this.userspaceToCanvasFactor,
      box.height * this.userspaceToCanvasFactor,
    );
  }

  canvasViewportToUserSpace(pt: Point): Point {
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
      this.userSpaceSize.height * this.userspaceToCanvasFactor,
    );
  }

  // TODO these are assuming overflow, with no padding, margin, etc

  get canvasWidth() {
    if (!this.canvas?.parentElement) {
      return 0;
    }
    return this.canvas.parentElement.clientWidth;
  }

  get canvasHeight() {
    if (!this.canvas?.parentElement) {
      return 0;
    }
    return this.canvas.parentElement.clientHeight;
  }

  get userspaceToCanvasFactor() {
    return this.zoom * PX_PER_MM;
  }

  get userspaceToDeviceFactor() {
    return this.userspaceToCanvasFactor * this.pixelRatio;
  }

  /** The handle of the last request animation frame */
  private frameHandle = -1;

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

      const factor = this.userspaceToDeviceFactor;
      context.resetTransform();
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.setTransform(factor, 0, 0, factor, -this.viewport.x * factor, -this.viewport.y * factor);
      context.lineWidth = LINE_STROKE_WIDTH;
      this.render(context, this.viewport);
    });
  }

  toJSON() {
    return {
      scrollX: this.scrollX,
      scrollY: this.scrollY,
      viewport: this.viewport,
      zoom: this.zoom,
    };
  }

  fromJSON(value: Record<string, unknown>) {
    this.scrollX = numberOrDefault(value.scrollX, 0);
    this.scrollY = numberOrDefault(value.scrollY, 0);
    this.zoom = numberOrDefault(value.zoom, 0);

    if (isRecord(value.viewport)) {
      const x = numberOrDefault(value.viewport.x, 0);
      const y = numberOrDefault(value.viewport.y, 0);
      const w = numberOrDefault(value.viewport.width, 0);
      const h = numberOrDefault(value.viewport.height, 0);
      this.viewport = new Box(x, y, w, h);
    }
  }
}

/**
 * Move from the current value to the desired value, clamping to the given min and max.
 */
const clamp = (desired: number, min: number, max: number) => {
  if (desired < min) {
    return min;
  } else if (desired > max) {
    return max;
  } else {
    return desired;
  }
};
