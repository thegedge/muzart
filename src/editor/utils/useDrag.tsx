import { clamp } from "lodash";
import { RefObject } from "preact";
import { useRef } from "preact/hooks";

export type OnDragOptions<T> = {
  /**
   * The element that will bound the drag (the position values will be relative to this element).
   *
   * @default `document.body`
   */
  boundedBy: RefObject<Element> | null;

  /**
   * Callback for a drag event.
   *
   * @param dragging The element that is being dragged
   * @param px The x position of the mouse relative to the parent element (0 to 1)
   * @param py The y position of the mouse relative to the parent element (0 to 1)
   * @param event the DOM event that triggered the drag
   */
  onDrag: (dragging: T, px: number, py: number, event: PointerEvent) => void;

  /**
   * Callback for when the drag begins.
   *
   * @param dragging The element that is being dragged
   */
  onDragStart?: (dragging: T) => void;

  /**
   * Callback for when the drag ends.
   *
   * @param dragging The element that was being dragged
   */
  onDragEnd?: (dragging: T) => void;
};

/**
 * Hook for dragging an element
 */
export function useDrag<T>(options: OnDragOptions<T>) {
  const dragging = useRef<T | null>(null);
  const boundingRect = useRef<DOMRect | null>(null);

  const onPointerMove = (event: PointerEvent) => {
    event.preventDefault();

    if (dragging.current && boundingRect.current) {
      const x = clamp((event.clientX - boundingRect.current.left) / boundingRect.current.width, 0, 1);
      const y = clamp((event.clientY - boundingRect.current.top) / boundingRect.current.height, 0, 1);
      options.onDrag(dragging.current, x, y, event);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    event.preventDefault();

    if (dragging.current) {
      // Trigger one last drag event to update the position
      onPointerMove(event);

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      options.onDragEnd?.(dragging.current);

      boundingRect.current = null;
      dragging.current = null;
    }
  };

  const startDrag = (target: T) => {
    const element = options.boundedBy?.current ?? document.body;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    boundingRect.current = element.getBoundingClientRect();
    dragging.current = target;
    options.onDragStart?.(target);
  };

  return {
    startDrag,
    currentlyDragging: dragging,
  };
}
