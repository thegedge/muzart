import { CanvasState } from "./CanvasState";

const PX_PER_MM = 4; // assuming 96 pixels per inch, rounded up (from 3.7795275591) so we have integers

export interface Point {
  x: number;
  y: number;
}

export type CanvasMouseEventHandler = (p: Point, event: MouseEvent) => void;

interface CanvasProps {
  /** The root element to mount the canvas into */
  root: HTMLElement;

  /** The state to use for this canvas element */
  state: CanvasState;

  /** If true, all mouse/keyboard interactions are disabled (e.g., scrolling, zoom) */
  disabled?: boolean;

  onContextMenu?: CanvasMouseEventHandler;
  onDoubleClick?: CanvasMouseEventHandler;
  onMouseDown?: CanvasMouseEventHandler;
  onMouseMove?: CanvasMouseEventHandler;
}

type Disposer = () => void;

export class Canvas {
  private readonly disposers: Disposer[] = [];
  private root: HTMLElement;
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private state: CanvasState;

  constructor(props: CanvasProps) {
    const { state, root, disabled, onDoubleClick, onMouseDown, onMouseMove, onContextMenu } = props;
    const document = root.ownerDocument;

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";

    const canvas = document.createElement("canvas");
    canvas.width = window.screen.width * window.devicePixelRatio;
    canvas.height = window.screen.height * window.devicePixelRatio;
    canvas.style.width = window.screen.width + "px";
    canvas.style.height = window.screen.height + "px";
    canvas.style.imageRendering = "crisp-edges";
    onDoubleClick && canvas.addEventListener("dblclick", wrapMouseEvent(state, onDoubleClick));
    onMouseDown && canvas.addEventListener("mousedown", wrapMouseEvent(state, onMouseDown));
    onMouseMove && canvas.addEventListener("mousemove", wrapMouseEvent(state, onMouseMove));
    onContextMenu && canvas.addEventListener("contextmenu", wrapMouseEvent(state, onContextMenu));

    container.appendChild(canvas);

    const disposers = [];

    if (!disabled) {
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
      disposers.push(() => {
        clearTimeout(wheelTimeout);
        container.removeEventListener("wheel", wheelListener);
      });
    }

    if (!disabled) {
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
      disposers.push(() => {
        container.removeEventListener("touchstart", touchStartListener);
        container.removeEventListener("touchmove", touchMoveListener);
      });
    }

    this.root = root;
    this.state = state;
    this.canvas = canvas;
    this.element = container;
  }

  mount() {
    this.root.appendChild(this.element);
    this.state.setCanvas(this.canvas);

    return () => {
      this.disposers.forEach((d) => d());
      this.state.setCanvas(null);
      this.root.removeChild(this.element);
    };
  }
}

const wrapMouseEvent = (state: CanvasState, handler: CanvasMouseEventHandler): ((ev: MouseEvent) => void) => {
  return (event) => {
    const pt = state.canvasViewportToUserSpace({ x: event.offsetX, y: event.offsetY });
    handler(pt, event);
  };
};
