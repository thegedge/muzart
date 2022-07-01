import { LayoutElement } from "../types";
import { AbstractGroup } from "./AbstractGroup";

export class SimpleGroup<T extends LayoutElement> extends AbstractGroup<T> {
  readonly type = "Group";

  addElement(element: T) {
    element.parent = this;
    this.elements.push(element);
  }
}
