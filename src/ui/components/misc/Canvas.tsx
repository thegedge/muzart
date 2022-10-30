import { observer } from "mobx-react-lite";
import { RefCallback } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import { createKeybindingsHandler } from "tinykeys";
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
  size: Box;
  render: RenderFunction;
  state?: CanvasState;

  onClick?: (p: Point) => void;
  onMouseMove?: (p: Point) => void;
}

// eslint-disable-next-line react/display-name
export const Canvas = observer((props: CanvasProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const state = useMemo(() => props.state ?? new CanvasState(), [props.state]);

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
  const onClick: JSXInternal.MouseEventHandler<HTMLElement> | undefined = onClickProp
    ? (evt) => {
        const pt = state.canvasViewportToUserSpace(evt);
        onClickProp(pt);
      }
    : undefined;

  const onMouseMoveProp = props.onMouseMove;
  const onMouseMove: JSXInternal.MouseEventHandler<HTMLElement> | undefined = onMouseMoveProp
    ? (evt) => {
        const pt = state.canvasViewportToUserSpace(evt);
        onMouseMoveProp(pt);
      }
    : undefined;

  const setCanvasRef = useCallback<RefCallback<HTMLCanvasElement>>(
    (canvas) => {
      state.setCanvas(canvas);
    },
    [state]
  );

  return (
    <div ref={setContainer} className="flex-1 overflow-hidden">
      <canvas
        ref={setCanvasRef}
        className="w-full h-full"
        style={{ imageRendering: "high-quality", cursor: state.cursor }}
        onClick={onClick}
        onMouseMove={onMouseMove}
      />
    </div>
  );
});

export const scrollWithClamping = (current: number, desired: number, min: number, max: number) => {
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
