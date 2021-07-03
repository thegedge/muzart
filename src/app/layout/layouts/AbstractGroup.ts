import { LayoutElement } from "../types";
import Box from "../utils/Box";
import { MaybeLayout } from "./types";

export abstract class AbstractGroup<T extends MaybeLayout<LayoutElement>, Parent = LayoutElement> {
  public parent?: Parent;
  public elements: T[] = [];

  constructor(public box = new Box(0, 0, 0, 0)) {}

  reset() {
    for (const element of this.elements) {
      element.parent = undefined;
    }

    this.elements = [];
    this.box.width = 0;
    this.box.height = 0;
  }
}
