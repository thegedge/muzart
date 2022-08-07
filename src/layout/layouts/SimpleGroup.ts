import types from "..";
import { AbstractGroup } from "./AbstractGroup";

/**
 * A group that doesn't have any layout, but will ensure an element is laid out when
 */
export abstract class SimpleGroup<
  T extends types.LayoutElement,
  Type extends string = "Group",
  ParentT extends types.LayoutElement | null = types.LayoutElement
> extends AbstractGroup<T, Type, ParentT> {
  addElement(element: T) {
    this.children.push(element);
    element.parent = this;
  }

  layout() {
    for (const element of this.children) {
      element.layout?.();
    }
  }
}

/**
 * An element that implements a {@link SimpleGroup} layout
 */
export class SimpleGroupElement<T extends types.LayoutElement> extends SimpleGroup<T> {
  readonly type = "Group";
}
