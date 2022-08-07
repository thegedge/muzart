import types from "..";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Wrapped<T extends types.LayoutElement<unknown>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extends LayoutElement<"Wrapped", any>
  implements types.Wrapped<T>
{
  readonly type = "Wrapped";

  constructor(readonly element: T) {
    super(Box.empty());
    element.parent = this;
  }

  layout() {
    this.element.layout?.();
  }
}
