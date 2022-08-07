import { defaults, isNull, last, sum, zip } from "lodash";
import { LayoutElement } from "../types";
import { Box } from "../utils/Box";
import { MaybeLayout } from "./types";

export type FlexProps = {
  /** If `true`, don't adjust this element during `layout` */
  fixed: boolean;

  /**
   * The stretch factor, which impacts how this element's dimensions will be stretched along the main axis.
   *
   * If null, no stretching. Otherwise, the basis will act as a "weight" in the
   */
  factor: number | null;
};

export type FlexGroupConfig = {
  box?: Box;
  gap?: number;
  defaultFlexProps?: Partial<FlexProps>;
  axis?: "vertical" | "horizontal";
};

/**
 * A group that lays out objects along an axis.
 *
 * If, after laying out the child elements, there is still space left in the box of this group, distribute that space to all
 * elements that can be stretched (flex props with a non-null factor and not fixed).
 */
export abstract class FlexGroup<T extends MaybeLayout<LayoutElement>, Parent extends LayoutElement = LayoutElement> {
  abstract readonly type: string;
  readonly elements: T[] = [];

  public parent: Parent | null = null;
  public box: Box;

  private defaultFlexProps: FlexProps;
  private flexProps: FlexProps[] = [];
  private gap: number;

  private startAttribute: "x" | "y";
  private endAttribute: "right" | "bottom";
  private dimensionAttribute: "width" | "height";

  constructor(config: FlexGroupConfig) {
    const { defaultFlexProps, axis } = defaults(config, { axis: "horizontal" });

    this.gap = config.gap ?? 0;
    this.box = config.box || new Box(0, 0, 0, 0);
    this.defaultFlexProps = defaults(defaultFlexProps, { factor: 1, fixed: false });
    if (axis == "vertical") {
      this.startAttribute = "y";
      this.endAttribute = "bottom";
      this.dimensionAttribute = "height";
    } else {
      this.startAttribute = "x";
      this.endAttribute = "right";
      this.dimensionAttribute = "width";
    }
  }

  /**
   * Try adding an element to this flex group, but only if it will fit along the main axis.
   *
   * @param element the element to add
   * @param flexProps optional flex properties to associate with this element
   *
   * @returns `true` if the element was added, `false` otherwise
   */
  tryAddElement(element: T, flexProps?: Partial<FlexProps>): boolean {
    const lastElement = last(this.elements);
    if (lastElement) {
      if (
        lastElement.box[this.endAttribute] + this.gap + element.box[this.dimensionAttribute] >
        this.box[this.dimensionAttribute]
      ) {
        return false;
      }

      element.box[this.startAttribute] = lastElement.box[this.endAttribute] + this.gap;
    }

    element.parent = this;
    this.elements.push(element);
    this.flexProps.push(defaults({}, flexProps, this.defaultFlexProps));
    return true;
  }

  addElement(element: T, flexProps?: Partial<FlexProps>): void {
    const lastElement = last(this.elements);
    if (lastElement) {
      element.box[this.startAttribute] = lastElement.box[this.endAttribute] + this.gap;
    }
    element.parent = this;
    this.elements.push(element);
    this.flexProps.push(defaults({}, flexProps, this.defaultFlexProps));
  }

  popElement(): T | undefined {
    this.flexProps.pop();
    const element = this.elements.pop();
    if (element) {
      element.parent = null;
    }
    return element;
  }

  /**
   * Reposition and scale all inner elements so that they fill this flex group's box
   *
   * @param stretch if `true`, stretch relevant elements to fit the layout
   */
  public layout(stretch = true) {
    const zipped = zip(this.elements, this.flexProps) as [T, FlexProps][];
    const stretchable = zipped.filter((v) => !isNull(v[1].fixed));

    let factorsSum = 1;
    let extraSpace = 0;
    if (stretch && stretchable.length > 0) {
      factorsSum = sum(stretchable.map((v) => v[1].factor || 0));
      if (factorsSum == 0) {
        factorsSum = 1;
      }

      const lastElement = last(this.elements);
      if (lastElement) {
        extraSpace = this.box[this.dimensionAttribute] - lastElement.box[this.endAttribute];

        // When adding elements, we added the gap, so we need to take that away from the extra space too
        extraSpace -= this.gap * (this.elements.length - 1);
      }
    }

    // Casting to any in here because we can't assign to box properties this way
    let start = 0;
    for (const [element, props] of stretchable) {
      element.box[this.startAttribute] = start;
      if (props.factor) {
        element.box[this.dimensionAttribute] += extraSpace * (props.factor / factorsSum);
      }

      if (element.layout) {
        element.layout();
      }

      start += element.box[this.dimensionAttribute] + this.gap;
    }
  }
}

export class FlexGroupElement<T extends MaybeLayout<LayoutElement>> extends FlexGroup<T> {
  readonly type = "Group";
}
