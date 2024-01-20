import { observer } from "mobx-react-lite";
import { RefCallback } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import { Box, PX_PER_MM } from "../../../layout";
import { CanvasState } from "./CanvasState";

export interface RenderFunction {
  (context: CanvasRenderingContext2D, viewport: Box): void;
}

export interface Point {
  x: number;
  y: number;
}

interface CanvasProps {
  state: CanvasState;

  onMouseDown?: (p: Point) => void;
  onDoubleClick?: (p: Point) => void;
  onMouseMove?: (p: Point) => void;
}

// eslint-disable-next-line react/display-name
export const Canvas = observer((props: CanvasProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const state = props.state;

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
          state.zoomCenteredOn(state.zoom * Math.exp(-event.deltaY / PX_PER_MM / 100), event.offsetX, event.offsetY);
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

  const setCanvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (canvas) => {
      if (canvas) {
        state.setCanvas(canvas);
      }
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
          cursor: state.cursor,
        }}
        onMouseDown={props.onMouseDown && wrapMouseEvent(state, props.onMouseDown)}
        onDblClick={props.onDoubleClick && wrapMouseEvent(state, props.onDoubleClick)}
        onMouseMove={props.onMouseMove && wrapMouseEvent(state, props.onMouseMove)}
      />
    </div>
  );
});

const wrapMouseEvent = (
  state: CanvasState,
  handler: (p: Point) => void,
): JSXInternal.MouseEventHandler<HTMLElement> => {
  return (event) => {
    const pt = state.canvasViewportToUserSpace({ x: event.offsetX, y: event.offsetY });
    handler(pt);
  };
};
