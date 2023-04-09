import { makeAutoObservable } from "mobx";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";
import { SyncStorage, isRecord, numberOrDefault } from "../../storage/Storage";
import { VIEW_STATE_CANVAS_SUBKEY, VIEW_STATE_NAMESPACE } from "../../storage/namespaces";
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

  private canvasResizeObserver: ResizeObserver;
  private centerOnFirstResize = true;

  constructor(readonly storage: SyncStorage) {
    this.storage.loadObject(VIEW_STATE_NAMESPACE, VIEW_STATE_CANVAS_SUBKEY, this);

    // "debounce" events to avoid having the canvas flicker, at the cost of stretching what's currently painted
    let timeoutHandle = -1;
    this.canvasResizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutHandle);
      timeoutHandle = window.setTimeout(() => {
        // Compute these values before `updateCanvas`, because it will adjust the viewport
        const x = this.viewport.centerX * this.userspaceToCanvasFactor;
        const y = this.viewport.centerY * this.userspaceToCanvasFactor;

        this.setPixelRatio(devicePixelRatio);
        if (this.centerOnFirstResize) {
          this.centerViewportOn();
        } else {
          this.centerViewportOn(x, y);
        }
      }, 100);
    });

    makeAutoObservable(this, {});
  }

  dispose() {
    this.canvasResizeObserver.disconnect();
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    if (canvas === this.canvas) {
      return;
    }

    if (this.canvas) {
      this.canvasResizeObserver.unobserve(this.canvas);
    }

    if (canvas) {
      this.centerOnFirstResize = true;
      this.canvasResizeObserver.observe(canvas, {
        box: "device-pixel-content-box",
      });
    }

    this.canvas = canvas;
    this.updateCanvas();
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
    this.updateCanvas();
  }

  centerViewportOn(): void;
  centerViewportOn(x: number, y: number): void;
  centerViewportOn(x?: number, y?: number): void {
    if (!this.canvas) {
      return;
    }

    this.centerOnFirstResize = false;

    const pageW = this.canvas.width / this.pixelRatio;
    const pageH = this.canvas.height / this.pixelRatio;
    if (typeof x == "undefined" || typeof y == "undefined") {
      const canvasSpaceWidth = this.canvasSpaceSize.width;
      if (canvasSpaceWidth < pageW) {
        this.scrollX = -0.5 * (pageW - canvasSpaceWidth);
      }
    } else {
      this.scrollX = x - 0.5 * pageW;
      this.scrollY = y - 0.5 * pageH;
    }

    this.updateViewport();
  }

  updateCanvas() {
    if (this.canvas) {
      // TODO maybe consider setting a flag and only doing this on render to avoid flicker?
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
    if (!this.canvas || this.canvas.width == 0 || this.canvas.height == 0) {
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

    void this.storage.store(VIEW_STATE_NAMESPACE, VIEW_STATE_CANVAS_SUBKEY, this);

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

      const factor = this.zoom * this.pixelRatio * PX_PER_MM;
      context.setTransform(factor, 0, 0, factor, -this.viewport.x * factor, -this.viewport.y * factor);
      context.clearRect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
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

const scrollWithClamping = (current: number, desired: number, min: number, max: number) => {
  if (desired < min) {
    if (current > min) {
      desired = min;
    } else if (desired < current) {
      desired = current;
    }
  } else if (desired > max) {
    if (current < max) {
      desired = max;
    } else if (desired > current) {
      desired = current;
    }
  }
  return desired;
};
