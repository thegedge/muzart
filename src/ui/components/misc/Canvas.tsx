import { makeAutoObservable } from "mobx";
import { Observer } from "mobx-react-lite";
import { useMemo } from "preact/hooks";
import React, { useEffect, useState } from "react";
import { Box, LINE_STROKE_WIDTH, PX_PER_MM } from "../../../layout";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

export interface Point {
  x: number;
  y: number;
}

// eslint-disable-next-line react/display-name
export const Canvas = React.memo((props: { render: RenderFunction; size: Box; onClick: (p: Point) => void }) => {
  const [scroll, setScroll] = useState<HTMLDivElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const state = useMemo(() => {
    return new CanvasState(props.size, props.render);
  }, [props.size, props.render]);

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
          state.setZoom(Math.max(0.1, Math.min(5, state.zoom * Math.exp(-event.deltaY / PX_PER_MM / 100))));
        } else {
          scroll.scrollBy(0, event.deltaY);
        }
      }

      wheelTimeout = window.setTimeout(() => {
        startingWheelEvent = true;
        zooming = false;
      }, 50);
    };

    const scrollListener = () => {
      const factor = state.zoom * PX_PER_MM;
      state.setScroll(scroll.scrollLeft / factor, scroll.scrollTop / factor);
    };

    scroll.addEventListener("scroll", scrollListener, { passive: true });
    scroll.addEventListener("wheel", wheelListener);
    return () => {
      scroll.removeEventListener("wheel", wheelListener);
      scroll.removeEventListener("scroll", scrollListener);
    };
  }, [state, scroll]);

  useEffect(() => {
    state.setCanvas(canvas);
  }, [canvas]);

  const onClick = () => {
    if (!props.onClick) {
      return;
    }

    const p = { x: 0, y: 0 };
    props.onClick(p);
  };

  return (
    <div ref={setScroll} className="relative flex-1 overflow-auto">
      <Observer>
        {() => (
          <div
            className="absolute"
            onClick={onClick}
            style={{
              width: `${state.zoom * props.size.width * PX_PER_MM}px`,
              height: `${state.zoom * props.size.height * PX_PER_MM}px`,
            }}
          />
        )}
      </Observer>
      <canvas ref={setCanvas} className="sticky left-0 top-0 w-full h-full" style={{ imageRendering: "crisp-edges" }} />
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

  constructor(readonly userSpaceSize: Box, readonly render: RenderFunction) {
    makeAutoObservable(this, {});
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    if (this.canvas) {
      this.updateCanvas();
      this.redraw();
    }
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
    this.updateViewport();
  }

  setPixelRatio(pixelRatio: number) {
    this.pixelRatio = pixelRatio;
    this.updateViewport();
  }

  updateCanvas() {
    if (!this.canvas) {
      return;
    }

    const canvasRect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.ceil(canvasRect.width * this.pixelRatio);
    this.canvas.height = Math.ceil(canvasRect.height * this.pixelRatio);
    this.updateViewport();
  }

  setScroll(x: number, y: number) {
    this.scrollX = x;
    this.scrollY = y;
    this.updateViewport();
  }

  updateViewport() {
    if (!this.canvas) {
      return;
    }

    // Convert the device space into user space. We first ensure everything is in device coordinates, and then
    // divide by the scaling factor at the end to bring everything back to user space.
    let x = this.scrollX * this.deviceToUserspaceFactor;
    const y = this.scrollY * this.deviceToUserspaceFactor;
    const w = this.userSpaceSize.width * this.deviceToUserspaceFactor;
    if (w < this.canvas.width) {
      x -= 0.5 * (this.canvas.width - w);
    }

    this.viewport = new Box(
      x / this.deviceToUserspaceFactor,
      y / this.deviceToUserspaceFactor,
      this.canvas.width / this.deviceToUserspaceFactor,
      this.canvas.height / this.deviceToUserspaceFactor
    );
    this.redraw();
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
