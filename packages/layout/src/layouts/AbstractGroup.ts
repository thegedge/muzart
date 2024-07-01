import { LayoutElement, type AnyLayoutElement } from "../elements/LayoutElement";

export abstract class AbstractGroup<Type extends string, ChildT extends AnyLayoutElement> extends LayoutElement<Type> {
  abstract readonly type: Type;

  children: ChildT[] = [];

  reset() {
    for (const element of this.children) {
      element.parent = null;
    }

    this.children = [];
    this.box.width = 0;
    this.box.height = 0;
  }
}
