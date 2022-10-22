import { makeAutoObservable } from "mobx";
import { Observer } from "mobx-react-lite";
import { MutableRef, useMemo } from "preact/hooks";
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
  const [scroll, setScroll] = useState<HTMLDivElement | null>(null);
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

  // TODO don't change the canvas width/height, just set it to the viewport width/height
  useEffect(() => {
    const update = () => state.updateCanvas();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [state]);

  useEffect(() => {
    if (!scroll) {
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
          state.setZoom(state.zoom * Math.exp(-event.deltaY / PX_PER_MM / 100));
        }
      }

      if (!zooming && (event.deltaX != 0 || event.deltaY != 0)) {
        scroll.scrollBy(event.deltaX, event.deltaY);
      }

      wheelTimeout = window.setTimeout(() => {
        startingWheelEvent = true;
        zooming = false;
      }, 50);
    };

    const scrollListener = () => {
      state.setScroll(scroll.scrollLeft, scroll.scrollTop);
    };

    scroll.addEventListener("scroll", scrollListener, { passive: true });
    scroll.addEventListener("wheel", wheelListener);
    return () => {
      scroll.removeEventListener("wheel", wheelListener);
      scroll.removeEventListener("scroll", scrollListener);
    };
  }, [state, scroll]);

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

  return (
    <div ref={setScroll} className="relative flex-1 overflow-auto">
      <canvas
        ref={(canvas) => {
          state.setCanvas(canvas);
          (canvasRef as MutableRef<HTMLCanvasElement | null>).current = canvas;
        }}
        className="sticky left-0 top-0 w-full h-full"
        style={{ imageRendering: "crisp-edges" }}
        onClick={onClick}
        onMouseMove={onMouseMove}
      />
      <Observer>
        {() => (
          <div
            className="absolute"
            style={{
              top: 0,
              left: 0,
              width: `${state.zoom * props.size.width * PX_PER_MM}px`,
              height: `${state.zoom * props.size.height * PX_PER_MM}px`,
              pointerEvents: "none",
            }}
          />
        )}
      </Observer>
    </div>
  );
});

class CanvasState {
  canvas: HTMLCanvasElement | null = null;

  /** The zoom level, a linear scaling factor applied to the entire canvas */
  zoom = 1;

  /** The actual device pixel ratio */
  pixelRatio = devicePixelRatio;

  /** The viewport, in user space coordinates */
  viewport = Box.empty();

  /** The handle of the last request animation frame */
  frameHandle = -1;

  /** The horizontal scroll offset, in device units */
  scrollX = 0;

  /** The vertical scroll offset, in device units */
  scrollY = 0;

  /** The size of the user coordinate space */
  userSpaceSize = Box.empty();

  /** The function to call when a redraw needs to occur */
  render: RenderFunction = () => void 0;

  constructor() {
    makeAutoObservable(this, {});
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.updateCanvas();
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
    this.zoom = Math.max(0.1, Math.min(5, zoom));
    this.updateViewport();
  }

  setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
    this.updateCanvas();
  }

  updateCanvas() {
    if (this.canvas) {
      const canvasRect = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.ceil(canvasRect.width * this.pixelRatio);
      this.canvas.height = Math.ceil(canvasRect.height * this.pixelRatio);
    }
    this.updateViewport();
  }

  setScroll(x: number, y: number) {
    const factor = this.zoom * PX_PER_MM;
    this.scrollX = x / factor;
    this.scrollY = y / factor;
    this.updateViewport();
  }

  updateViewport() {
    if (!this.canvas) {
      return;
    }

    const { x, y } = this.canvasToUserSpace({ x: 0, y: 0 });

    this.viewport = new Box(
      x,
      y,
      this.canvas.width / this.deviceToUserspaceFactor,
      this.canvas.height / this.deviceToUserspaceFactor
    );
    this.redraw();
  }

  canvasToUserSpace(pt: Point): Point {
    if (!this.canvas) {
      return pt;
    }

    // Convert the device space into user space. We first ensure everything is in device coordinates, and then
    // divide by the scaling factor at the end to bring everything back to user space.
    let x = this.scrollX * this.deviceToUserspaceFactor + pt.x * this.pixelRatio;
    const y = this.scrollY * this.deviceToUserspaceFactor + pt.y * this.pixelRatio;
    const w = this.userSpaceSize.width * this.deviceToUserspaceFactor;
    if (w < this.canvas.width) {
      x -= 0.5 * (this.canvas.width - w);
    }

    return {
      x: x / this.deviceToUserspaceFactor,
      y: y / this.deviceToUserspaceFactor,
    };
  }

  get deviceToUserspaceFactor() {
    return this.zoom * this.pixelRatio * PX_PER_MM;
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
