import { LayoutElement, Wrapped } from "..";
import { Box } from "../utils/Box";

export function wrap<T extends LayoutElement>(element: T) {
  const wrapped: Wrapped<T> = {
    type: "Wrapped",
    element,
    box: new Box(0, 0, 0, 0),
  };
  element.parent = wrapped;
  return wrapped;
}
