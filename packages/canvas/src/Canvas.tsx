import { observer } from "mobx-react-lite";
import type { MouseEvent, RefCallback } from "react";
import React, { useCallback, useEffect, useState } from "react";
import { CanvasState } from "./CanvasState";

const PX_PER_MM = 4; // assuming 96 pixels per inch, rounded up (from 3.7795275591) so we have integers

export interface Point {
  x: number;
  y: number;
}

export type CanvasMouseEventHandler = (p: Point, event: MouseEvent) => void;

interface CanvasProps {
  /** The state to use for this canvas element */
  state: CanvasState;

  /** If true, all mouse/keyboard interactions are disabled (e.g., scrolling, zoom) */
  disabled?: boolean;

  onContextMenu?: CanvasMouseEventHandler;
  onDoubleClick?: CanvasMouseEventHandler;
  onMouseDown?: CanvasMouseEventHandler;
  onMouseMove?: CanvasMouseEventHandler;
}

export const Canvas = observer((props: CanvasProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const state = props.state;

  useEffect(() => {
    if (!container || props.disabled) {
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
          state.zoomCenteredOn(Math.exp(event.deltaY / PX_PER_MM / 100), event.offsetX, event.offsetY);
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
  }, [state, container, props.disabled]);

  useEffect(() => {
    if (!container || props.disabled) {
      return;
    }

    let startX = 0;
    let startY = 0;

    const touchStartListener = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }

      event.preventDefault();
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const touchMoveListener = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        return;
      }

      event.preventDefault();
      const dx = event.touches[0].clientX - startX;
      const dy = startY - event.touches[0].clientY;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      state.scrollBy(dx, dy);
    };

    container.addEventListener("touchstart", touchStartListener);
    container.addEventListener("touchmove", touchMoveListener);
    return () => {
      container.removeEventListener("touchstart", touchStartListener);
      container.removeEventListener("touchmove", touchMoveListener);
    };
  }, [state, container, props.disabled]);

  const setCanvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (canvas) => {
      state.setCanvas(canvas);
    },
    [state],
  );

  return (
    <div ref={setContainer} className="h-full w-full overflow-hidden">
      <canvas
        ref={setCanvasRef}
        width={window.screen.width * window.devicePixelRatio}
        height={window.screen.height * window.devicePixelRatio}
        style={{
          width: window.screen.width,
          height: window.screen.height,
          imageRendering: "crisp-edges",
        }}
        onDoubleClick={props.onDoubleClick && wrapMouseEvent(state, props.onDoubleClick)}
        onMouseDown={props.onMouseDown && wrapMouseEvent(state, props.onMouseDown)}
        onMouseMove={props.onMouseMove && wrapMouseEvent(state, props.onMouseMove)}
        onContextMenu={props.onContextMenu && wrapMouseEvent(state, props.onContextMenu)}
      />
    </div>
  );
});

const wrapMouseEvent = (state: CanvasState, handler: CanvasMouseEventHandler): React.MouseEventHandler<HTMLElement> => {
  return (event) => {
    const pt = state.canvasViewportToUserSpace({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
    handler(pt, event);
  };
};
