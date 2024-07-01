import type { AnyLayoutElement } from "../elements/LayoutElement";
import { Box } from "../utils/Box";
import { AbstractGroup } from "./AbstractGroup";

/**
 * A group that lays out all of its children, adjusting its own box to have dimensions that encompass all children.
 *
 * Note that the x/y coordinate of the groups box is not changed.
 */
export abstract class SimpleGroup<Type extends string, ChildT extends AnyLayoutElement> extends AbstractGroup<
  Type,
  ChildT
> {
  addElement(element: ChildT) {
    this.children.push(element);
    element.parent = this;
  }

  layout() {
    let encompassing = Box.empty();
    for (const child of this.children) {
      child.layout();
      encompassing = encompassing.encompass(child.box);
    }

    this.box.width = encompassing.width;
    this.box.height = encompassing.height;
  }
}

/**
 * An element that implements a {@link SimpleGroup} layout
 */
export class SimpleGroupElement<ChildT extends AnyLayoutElement> extends SimpleGroup<"Group", ChildT> {
  readonly type = "Group";
}
