import { defaults, last } from "lodash";
import types, { Alignment } from "..";
import { Box } from "../utils/Box";

export type FlexProps = {
  /** The stretch factor, which impacts how this element's dimensions will be stretched along the main axis. */
  factor: number;

  /** @private */
  originalBox: Box;
};

export type FlexGroupConfig = {
  box: Box;

  /** The gap between elements. */
  gap: number;

  /** Default flex props when adding elements. */
  defaultFlexProps: Partial<FlexProps>;

  /** The direction of the main axis. */
  axis: "vertical" | "horizontal";

  /** Wrap elements that overflow the main axis size. */
  wrap: boolean;

  /**
   * How to ditribute space among elements on the main axis, like `justify-content` in CSS
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
   */
  mainAxisSpaceDistribution: Alignment; // TODO other alignments

  /**
   * How to ditribute space among elements on the cross axis, like `align-items` in CSS
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
   */
  crossAxisAlignment: Alignment;
};

/**
 * A group that lays out objects along an axis.
 *
 * If, after laying out the children, there is still space left in the box of this group, distribute that space to all
 * children that can be stretched (flex props with a non-null factor).
 */
export abstract class FlexGroup<
  T extends types.LayoutElement,
  Type extends string = "Group",
  Parent extends types.LayoutElement | null = types.LayoutElement
> {
  abstract readonly type: Type;
  readonly children: T[] = [];

  public parent: Parent | null = null;
  public box: Box;

  private defaultFlexProps: FlexProps;
  private flexProps: FlexProps[] = [];
  private gap: number;
  private wrap: boolean;
  private mainAxisSpaceDistribution: FlexGroupConfig["mainAxisSpaceDistribution"];
  private crossAxisAlignment: FlexGroupConfig["crossAxisAlignment"];

  private startAttribute:
    | {
        main: "x";
        cross: "y";
      }
    | {
        main: "y";
        cross: "x";
      };

  private dimensionAttribute:
    | {
        main: "width";
        cross: "height";
      }
    | {
        main: "height";
        cross: "width";
      };

  private endAttribute: "right" | "bottom";

  constructor(config?: Partial<FlexGroupConfig>) {
    this.gap = config?.gap ?? 0;
    this.box = config?.box ?? Box.empty();
    this.defaultFlexProps = defaults(config?.defaultFlexProps, {
      factor: 1,
      originalBox: Box.empty(),
    });

    if (config?.axis == "vertical") {
      this.startAttribute = { main: "y", cross: "x" };
      this.dimensionAttribute = { main: "height", cross: "width" };
      this.endAttribute = "bottom";
    } else {
      this.startAttribute = { main: "x", cross: "y" };
      this.dimensionAttribute = { main: "width", cross: "height" };
      this.endAttribute = "right";
    }

    this.mainAxisSpaceDistribution = config?.mainAxisSpaceDistribution ?? "start";
    this.crossAxisAlignment = config?.crossAxisAlignment ?? "start";
    this.wrap = config?.wrap ?? false;
  }

  /**
   * Add an element to this flex group.
   *
   * @param element the element to add
   * @param flexProps optional flex properties to associate with this element
   */
  addElement(element: T, flexProps?: Partial<FlexProps>): void {
    const lastElement = last(this.children);
    if (lastElement) {
      element.box[this.startAttribute.main] = lastElement.box[this.endAttribute] + this.gap;
    }

    element.parent = this;
    this.children.push(element);
    this.flexProps.push(defaults({ originalBox: element.box }, flexProps, this.defaultFlexProps));
  }

  // TODO if we could configure this group with "wraps", we could get something like flex-wrap in CSS and not need `tryAddElement`

  /**
   * Try adding an element to this flex group, but only if it will fit along the main axis.
   *
   * @param element the element to add
   * @param flexProps optional flex properties to associate with this element
   *
   * @returns `true` if the element was added, `false` otherwise
   */
  tryAddElement(element: T, flexProps?: Partial<FlexProps>): boolean {
    const lastElement = last(this.children);
    if (lastElement) {
      const newRight = lastElement.box[this.endAttribute] + this.gap + element.box[this.dimensionAttribute.main];
      if (newRight > this.box[this.dimensionAttribute.main]) {
        return false;
      }
    }

    this.addElement(element, flexProps);
    return true;
  }

  popElement(): T | undefined {
    this.flexProps.pop();
    const element = this.children.pop();
    if (element) {
      element.parent = null;
    }
    return element;
  }

  /**
   * Reposition and scale all children so that they fill this flex group's box
   */
  public layout() {
    if (this.children.length == 0) {
      return;
    }

    let index = 0;
    let crossAxisStart = 0;
    while (index < this.children.length) {
      const startIndex = index;
      if (this.wrap) {
        // Figure out which elements can fit on a single line
        let remainingWidth = this.box[this.dimensionAttribute.main];
        while (remainingWidth > 0 && index < this.children.length) {
          const child = this.children[index];
          const props = this.flexProps[index];
          child.box = props.originalBox.clone();

          const childMainAxisSize = child.box[this.dimensionAttribute.main];
          if (index == startIndex) {
            // We need this branch to ensure a child too large for a line is still added, avoiding an otherwise infinite loop
            remainingWidth -= childMainAxisSize;
          } else if (childMainAxisSize + this.gap < remainingWidth) {
            remainingWidth -= childMainAxisSize + this.gap;
          } else {
            break;
          }

          index += 1;
        }
      } else {
        index = this.children.length;
      }

      const childrenWidth = this.children
        .slice(startIndex, index)
        .reduce((width, c) => width + c.box[this.dimensionAttribute.main], 0);
      const extraSpace = this.box[this.dimensionAttribute.main] - childrenWidth - (index - startIndex - 1) * this.gap;

      let factorsSum = this.flexProps.slice(startIndex, index).reduce((sum, p) => sum + p.factor, 0);
      let mainAxisStart: number;
      if (factorsSum == 0) {
        // Space distribution only makes sense when there's no stretchable items (i.e., factorsSum == 0) because otherwise
        // we'll consume all the extra space and want the first child to be at 0.
        switch (this.mainAxisSpaceDistribution) {
          case "start":
            mainAxisStart = 0;
            break;
          case "center":
            mainAxisStart = 0.5 * extraSpace;
            break;
          case "end":
            mainAxisStart = extraSpace;
            break;
        }

        factorsSum = 1;
      } else {
        mainAxisStart = 0;
      }

      // Adjust main axis attributes
      let crossAxisSize = 0;
      for (let childIndex = startIndex; childIndex < index; ++childIndex) {
        const child = this.children[childIndex];
        const props = this.flexProps[childIndex];

        child.box[this.startAttribute.main] = mainAxisStart;
        child.box[this.dimensionAttribute.main] += extraSpace * (props.factor / factorsSum);

        child.layout?.();

        mainAxisStart += child.box[this.dimensionAttribute.main] + this.gap;
        crossAxisSize = Math.max(crossAxisSize, child.box[this.dimensionAttribute.cross]);
      }

      // Adjust cross axis attributes
      for (let childIndex = startIndex; childIndex < index; ++childIndex) {
        const child = this.children[childIndex];

        let offset: number;
        switch (this.crossAxisAlignment) {
          case "start":
            offset = 0;
            break;
          case "center":
            offset = 0.5 * (crossAxisSize - child.box[this.dimensionAttribute.cross]);
            break;
          case "end":
            offset = crossAxisSize - child.box[this.dimensionAttribute.cross];
            break;
        }

        child.box[this.startAttribute.cross] = crossAxisStart + offset;
      }

      crossAxisStart += crossAxisSize + this.gap;
    }

    this.box[this.dimensionAttribute.cross] = crossAxisStart - this.gap;
  }
}

export class FlexGroupElement<T extends types.LayoutElement> extends FlexGroup<T> {
  readonly type = "Group";
}
