import { LayoutElement } from "../types";
import { AbstractGroup } from "./AbstractGroup";

export abstract class SimpleGroup<
  T extends LayoutElement,
  ParentT extends LayoutElement = LayoutElement
> extends AbstractGroup<T, ParentT> {
  abstract readonly type: string;

  addElement(element: T) {
    element.layout?.();
    element.parent = this;
    this.elements.push(element);
  }
}

export class SimpleGroupElement<T extends LayoutElement> extends SimpleGroup<T> {
  readonly type = "Group";
}
