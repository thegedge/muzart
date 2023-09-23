import types, { Box } from "..";
import { AbstractGroup } from "./AbstractGroup";

/**
 * A group that lays out all of its children, adjusting its own box to have dimensions that encompass all children.
 *
 * Note that the x/y coordinate of the groups box is not changed.
 */
export abstract class SimpleGroup<
  ChildT extends types.LayoutElement,
  Type extends string = "Group",
  ParentT extends types.LayoutElement | null = types.LayoutElement,
> extends AbstractGroup<ChildT, Type, ParentT> {
  addElement(element: ChildT) {
    this.children.push(element);
    element.parent = this;
  }

  layout() {
    let encompassing = Box.empty();
    for (const child of this.children) {
      child.layout?.();
      encompassing = encompassing.encompass(child.box);
    }

    this.box.width = encompassing.width;
    this.box.height = encompassing.height;
  }
}

/**
 * An element that implements a {@link SimpleGroup} layout
 */
export class SimpleGroupElement<T extends types.LayoutElement> extends SimpleGroup<T> {
  readonly type = "Group";
}
