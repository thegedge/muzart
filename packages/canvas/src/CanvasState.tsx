import type * as CSS from "csstype";
import { makeAutoObservable } from "mobx";
import { Box } from "./Box";
import { type Point } from "./Canvas";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

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

  /** The width of the visible canvas */
  canvasWidth = 0;

  /** The height of the visible canvas */
  canvasHeight = 0;

  /** The actual device pixel ratio */
  pixelRatio = devicePixelRatio;

  /** The viewport, in userspace coordinates */
  viewport = Box.empty();

  /** The size of the user coordinate space */
  userSpaceSize = Box.empty();

  /** The function to call when a redraw needs to occur */
  render: RenderFunction = () => void 0;

  // Non-observed properties on a parent element
  parentElementObserver: ResizeObserver | undefined;

  constructor() {
    makeAutoObservable(this, {
      parentElementObserver: false,
    });
  }

  dispose() {
    this.parentElementObserver?.disconnect();
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    if (canvas === this.canvas) {
      return;
    }

    this.parentElementObserver?.disconnect();
    this.canvas = canvas;

    // TODO if parent element is null, can we listen for canvas being attached?
    if (canvas && canvas.parentElement) {
      this.parentElementObserver = new ResizeObserver((entries) => {
        const borderBox = entries[0].borderBoxSize[0];
        this.setCanvasSize(borderBox.inlineSize, borderBox.blockSize);
      });
      this.parentElementObserver.observe(canvas.parentElement);
      this.setCanvasSize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
    }

    this.redraw();
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.viewport = this.viewport.update({ height: (this.viewport.width * height) / width });
    this.redraw();
  }

  setCursor(cursor: CSS.Property.Cursor) {
    this.canvas?.style.setProperty("cursor", cursor);
  }

  setUserSpaceSize(size: Box) {
    this.userSpaceSize = size;
    this.redraw();
  }

  setViewport(viewport: Box) {
    this.viewport = viewport;
    this.redraw();
  }

  setRenderFunction(f: RenderFunction) {
    this.render = f;
    this.redraw();
  }

  setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
    this.redraw();
  }

  zoom(amount: number) {
    const canvasHalfWidth = (0.5 * (this.canvas?.width ?? 0)) / this.pixelRatio;
    const canvasHalfHeight = (0.5 * (this.canvas?.height ?? 0)) / this.pixelRatio;
    this.zoomCenteredOn(amount, canvasHalfWidth, canvasHalfHeight);
  }

  zoomCenteredOn(amount: number, canvasX: number, canvasY: number) {
    // What we're trying to do here is find a value for `amount` that prevents the viewport from being too small or too
    // big, but we also want to maintain an aspect ratio. We do this by finding the limiting dimension, and then
    // adjusting the amount so that the viewport fits within our specified bounds.
    if (this.userSpaceSize.width < this.userSpaceSize.height) {
      if (this.viewport.height * amount > this.userSpaceSize.height) {
        amount = this.userSpaceSize.height / this.viewport.height;
      } else if (this.viewport.height * amount < 10) {
        amount = 10 / this.viewport.height;
      }
    } else {
      if (this.viewport.width * amount > this.userSpaceSize.width) {
        amount = this.userSpaceSize.width / this.viewport.width;
      } else if (this.viewport.width * amount < 10) {
        amount = 10 / this.viewport.width;
      }
    }

    const width = this.viewport.width * amount;
    const height = this.viewport.height * amount;

    this.setViewport(
      this.viewport.update({
        x:
          // width > this.userSpaceSize.width
          // ? -(0.5 * (this.userSpaceSize.width - this.canvasWidth / this.userspaceToCanvasFactorX))
          this.viewport.x + (canvasX / this.userspaceToCanvasFactorX) * (1 - amount),
        y:
          // height > this.userSpaceSize.height
          // ? -(0.5 * (this.userSpaceSize.height - this.canvasHeight / this.userspaceToCanvasFactorY))
          this.viewport.y + (canvasY / this.userspaceToCanvasFactorY) * (1 - amount),
        width,
        height,
      }),
    );
  }

  scrollBy(deltaCanvasX: number, deltaCanvasY: number) {
    const userspaceDeltaX = deltaCanvasX / this.userspaceToCanvasFactorX;
    const userspaceDeltaY = deltaCanvasY / this.userspaceToCanvasFactorY;
    this.scrollTo(this.viewport.x + userspaceDeltaX, this.viewport.y + userspaceDeltaY);
  }

  scrollIntoView(userspaceBox: Box) {
    if (this.viewport.contains(userspaceBox)) {
      return;
    }

    // TODO (maybe) depending on which direction we need to scroll, change how we decide to scroll. For example,
    //  when scrolling downwards, show an entire page after the given box, instead of centering.

    const x = userspaceBox.centerX - 0.5 * this.viewport.width;
    const y = userspaceBox.centerY - 0.5 * this.viewport.height;
    this.scrollTo(x, y);
  }

  scrollTo(userspaceX: number, userspaceY: number) {
    let minX: number;
    let maxX: number;
    if (this.viewport.width <= this.userSpaceSize.width) {
      minX = this.userSpaceSize.left;
      maxX = this.userSpaceSize.right - this.viewport.width;
    } else {
      const width = 0.5 * (this.userSpaceSize.width - this.canvasWidth / this.userspaceToCanvasFactorX);
      minX = width;
      maxX = width;
    }

    let minY: number;
    let maxY: number;
    if (this.viewport.height <= this.userSpaceSize.height) {
      minY = this.userSpaceSize.top;
      maxY = this.userSpaceSize.bottom - this.viewport.height;
    } else {
      const height = 0.5 * (this.userSpaceSize.width - this.canvasWidth / this.userspaceToCanvasFactorX);
      minY = height;
      maxY = height;
    }

    this.setViewport(
      this.viewport.update({
        x: scrollWithClamping(this.viewport.x, userspaceX, minX, maxX),
        y: scrollWithClamping(this.viewport.y, userspaceY, minY, maxY),
      }),
    );
  }

  userSpaceToCanvasViewport(box: Box) {
    return new Box(
      (box.x - this.viewport.x) * this.userspaceToCanvasFactorX,
      (box.y - this.viewport.y) * this.userspaceToCanvasFactorY,
      box.width * this.userspaceToCanvasFactorX,
      box.height * this.userspaceToCanvasFactorY,
    );
  }

  canvasViewportToUserSpace(pt: Point): Point {
    return {
      x: pt.x / this.userspaceToCanvasFactorX + this.viewport.x,
      y: pt.y / this.userspaceToCanvasFactorY + this.viewport.y,
    };
  }

  get canvasSpaceSize() {
    return new Box(
      0,
      0,
      this.userSpaceSize.width * this.userspaceToCanvasFactorX,
      this.userSpaceSize.height * this.userspaceToCanvasFactorY,
    );
  }

  get userspaceToCanvasFactorX() {
    return this.canvasWidth / this.viewport.width;
  }

  get userspaceToCanvasFactorY() {
    return this.canvasHeight / this.viewport.height;
  }

  /** The handle of the last request animation frame */
  private frameHandle = -1;

  redraw() {
    if (!this.canvas) {
      return;
    }

    if (
      this.canvasWidth == 0 ||
      this.canvasHeight == 0 ||
      this.canvasSpaceSize.width == 0 ||
      this.canvasSpaceSize.height == 0
    ) {
      return;
    }

    cancelAnimationFrame(this.frameHandle);

    this.frameHandle = requestAnimationFrame((_time) => {
      if (!this.canvas) {
        return;
      }

      const context = this.canvas.getContext("2d", { willReadFrequently: false });
      if (!context) {
        return;
      }

      const factorX = this.userspaceToCanvasFactorX * this.pixelRatio;
      const factorY = this.userspaceToCanvasFactorY * this.pixelRatio;

      context.resetTransform();
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.setTransform(factorX, 0, 0, factorY, -factorX * this.viewport.x, -factorY * this.viewport.y);
      context.lineWidth = LINE_STROKE_WIDTH;
      this.render(context, this.viewport);
    });
  }

  toJSON() {
    return {
      viewport: this.viewport,
    };
  }

  fromJSON(value: Record<string, unknown>) {
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
 * Clamp a desired value to a given min and max, but only if the current value is already within the min and max.
 * If the current value is outside the min and max, the current value is returned.
 */
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

// Copied from layout package
// TODO make this configured on the state itself

const LINE_STROKE_WIDTH = 0.1;

// Copied from editor/src/storage/Storage.ts

const isRecord = (value: unknown): value is Record<string, unknown> => {
  switch (typeof value) {
    case "function":
      // Functions or classes (not instances of classes, those are objects)
      return true;
    case "object":
      return value != null;
    default:
      return false;
  }
};

const numberOrDefault = (value: unknown, defaultValue: number): number => {
  return typeof value == "number" ? value : defaultValue;
};
