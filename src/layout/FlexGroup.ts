import { defaults, isNull, last, maxBy, sum, zip } from "lodash";
import Box from "./Box";
import { HasBox } from "./types";

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
  defaultFlexProps?: Partial<FlexProps>;
  axis?: "vertical" | "horizontal";

  /** If true, and the the axis is "horizontal", renderers should draw staff lines */
  drawStaffLines?: boolean;
};

// TODO "space between" option
export class FlexGroup<T extends HasBox & { layout?(): void }> {
  readonly elements: T[] = [];
  readonly drawStaffLines: boolean = false;
  public box: Box;

  private defaultFlexProps: FlexProps;
  private flexProps: FlexProps[] = [];

  private startAttribute: ("x" | "y") & keyof T["box"];
  private endAttribute: ("right" | "bottom") & keyof T["box"];
  private dimensionAttribute: ("width" | "height") & keyof T["box"];

  constructor(config: FlexGroupConfig) {
    const { defaultFlexProps, axis, drawStaffLines } = defaults(config, { axis: "horizontal" });

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
      this.drawStaffLines = !!drawStaffLines;
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
  tryAddElement(element: T, flexProps?: Partial<FlexProps>) {
    const lastElement = last(this.elements);
    if (lastElement) {
      if (lastElement.box[this.endAttribute] + element.box[this.dimensionAttribute] > this.box[this.endAttribute]) {
        return false;
      }

      // TODO figure out how to make TypeScript happy here without the `as any`
      (element.box as any)[this.startAttribute] = lastElement.box[this.endAttribute];
    }

    this.elements.push(element);
    this.flexProps.push(defaults({}, flexProps, this.defaultFlexProps));
    return true;
  }

  addElement(element: T, flexProps?: Partial<FlexProps>) {
    const lastElement = last(this.elements);
    if (lastElement) {
      (element.box as any)[this.startAttribute] = lastElement.box[this.endAttribute];
    }
    this.elements.push(element);
    this.flexProps.push(defaults({}, flexProps, this.defaultFlexProps));
  }

  popElement(): T | undefined {
    this.flexProps.pop();
    return this.elements.pop();
  }

  /**
   * Reposition and scale all inner elements so that they fill this flex group's box
   *
   * @param stretch if `true`, stretch relevant elements to fit the layout
   */
  public layout(stretch: boolean = true) {
    const zipped = zip(this.elements, this.flexProps) as [T, FlexProps][];
    const stretchable = zipped.filter((v) => !isNull(v[1].fixed));
    const farthest = maxBy(stretchable, `[0].box.${this.endAttribute}`);
    if (!farthest) {
      return;
    }

    const extraSpace = stretch ? this.box[this.dimensionAttribute] - farthest[0].box[this.endAttribute] : 0;
    const factorsSum = sum(stretchable.map((v) => v[1].factor || 0));

    // Casting to any because we know `elements` and `flexProps` have the same length, but `zip` always includes
    // `T | undefined` in the return type signature :(
    let start = 0;
    for (const [element, props] of stretchable) {
      (element.box as any)[this.startAttribute] = start;

      if (props.factor) {
        (element.box as any)[this.dimensionAttribute] += extraSpace * ((props.factor || 0) / factorsSum);
        if (element.layout) {
          element.layout();
        }
      }
      start += element.box[this.dimensionAttribute];
    }
  }
}

export class Group<T extends HasBox> extends FlexGroup<T> {
  readonly type = "Group";
}