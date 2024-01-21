import types from "..";
import { LayoutElement } from "../elements/LayoutElement";

export abstract class AbstractGroup<
  T extends types.AnyLayoutElement,
  Type extends string = "Group",
  ParentT extends types.AnyLayoutElement | null = types.AnyLayoutElement,
> extends LayoutElement<Type, ParentT> {
  abstract readonly type: Type;

  children: T[] = [];

  reset() {
    for (const element of this.children) {
      element.parent = null;
    }

    this.children = [];
    this.box.width = 0;
    this.box.height = 0;
  }
}
