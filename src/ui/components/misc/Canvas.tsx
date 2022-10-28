import { makeAutoObservable } from "mobx";
import { RefCallback } from "preact";
import { MutableRef, useCallback, useMemo } from "preact/hooks";
import React, { JSX, useEffect, useState } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

export interface Point {
  x: number;
  y: number;
}

interface CanvasProps {
  size: Box;
  render: RenderFunction;

  onClick?: (p: Point) => void;
  onMouseMove?: (p: Point) => void;
}

// eslint-disable-next-line react/display-name
export const Canvas = React.forwardRef<HTMLCanvasElement, CanvasProps>((props, canvasRef) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const state = useMemo(() => new CanvasState(), []);

  useEffect(() => {
    const listener = createKeybindingsHandler({
      "Meta+Equal": (event) => {
        event.preventDefault();
        state.setZoom(state.zoom * 1.2);
      },
      "Meta+Minus": (event) => {
        event.preventDefault();
        state.setZoom(state.zoom / 1.2);
      },
      "Meta+0": (event) => {
        event.preventDefault();
        state.setZoom(1);
        state.centerViewport();
      },
    });

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [state]);

  useEffect(() => state.setUserSpaceSize(props.size), [props.size]);
  useEffect(() => state.setRenderFunction(props.render), [props.render]);

  useEffect(() => {
    const update = () => state.setPixelRatio(devicePixelRatio);
    const media = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    media.addEventListener("change", update, { once: true });
    return () => media.removeEventListener("change", update);
  }, [state]);

  useEffect(() => {
    const update = () => state.updateCanvas();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [state]);

  useEffect(() => {
    if (!container) {
      return;
    }

    let startingWheelEvent = true;
    let zooming = false;
    let wheelTimeout = -1;

    const wheelListener = (event: WheelEvent) => {
      clearTimeout(wheelTimeout);

      if (startingWheelEvent) {
        zooming = event.metaKey;
        startingWheelEvent = false;
      }

      if (event.deltaY != 0) {
        // Disable font zooming and browser-controlled scrolling. I tried to just deal with the former and let the
        // browser deal with the latter, but it was too dang hard to get just right.
        event.preventDefault();
        event.stopPropagation();

        if (zooming) {
          // TODO if zooming out and everything fits on screen, may need to scroll up
          state.zoomCenteredOn(state.zoom * Math.exp(-event.deltaY / PX_PER_MM / 100), event.x, event.y);
        }
      }

      if (!zooming && (event.deltaX != 0 || event.deltaY != 0)) {
        state.scrollBy(event.deltaX, event.deltaY);
      }

      wheelTimeout = window.setTimeout(() => {
        startingWheelEvent = true;
        zooming = false;
      }, 50);
    };

    container.addEventListener("wheel", wheelListener);
    return () => {
      clearTimeout(wheelTimeout);
      container.removeEventListener("wheel", wheelListener);
    };
  }, [state, container]);

  const onClickProp = props.onClick;
  const onClick: JSX.MouseEventHandler<HTMLElement> | undefined = onClickProp
    ? (evt) => {
        const pt = state.canvasToUserSpace(evt);
        onClickProp(pt);
      }
    : undefined;

  const onMouseMoveProp = props.onMouseMove;
  const onMouseMove: JSX.MouseEventHandler<HTMLElement> | undefined = onMouseMoveProp
    ? (evt) => {
        const pt = state.canvasToUserSpace(evt);
        onMouseMoveProp(pt);
      }
    : undefined;

  const setCanvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (canvas) => {
      setTimeout(() => {
        state.setCanvas(canvas);
      }, 10);
      (canvasRef as MutableRef<HTMLCanvasElement | null>).current = canvas;
    },
    [state]
  );

  return (
    <div ref={setContainer} className="flex-1 overflow-hidden">
      <canvas
        ref={setCanvasRef}
        className="w-full h-full"
        style={{ imageRendering: "crisp-edges" }}
        onClick={onClick}
        onMouseMove={onMouseMove}
      />
    </div>
  );
});

/**
 * Manages the canvas state, translating between various coordinate spaces:
 *
 * 1. user space; the space in which the rendering occurs,
 * 2. canvas space; the space in which mouse events are created, and
 * 3. device space; the space in which rendering is performed (canvas space * pixel ratio)
 */
class CanvasState {
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
    this.scrollTo(this.scrollX + deltaX, this.scrollY + deltaY);
  }

  scrollTo(x: number, y: number) {
    if (!this.canvas) {
      return;
    }

    this.scrollX = x;
    this.scrollY = y;
    this.updateViewport();
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

    const { x, y } = this.canvasToUserSpace({ x: 0, y: 0 });

    this.viewport = new Box(
      x,
      y,
      this.canvas.width / this.userspaceToDeviceFactor,
      this.canvas.height / this.userspaceToDeviceFactor
    );
    this.redraw();
  }

  canvasToUserSpace(pt: Point): Point {
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
