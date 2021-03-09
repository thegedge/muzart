import { last, maxBy } from "lodash";
import Box from "./Box";
import { HasBox } from "./types";

// TODO "space between" option
// TODO elements need to specify if a dimension should stretch or not
export class FlexGroup<T extends HasBox> {
  readonly type = "Group";
  readonly elements: T[] = [];
  readonly drawStaffLines: boolean = false;

  private startAttribute: ("x" | "y") & keyof T["box"];
  private endAttribute: ("right" | "bottom") & keyof T["box"];
  private dimensionAttribute: ("width" | "height") & keyof T["box"];

  constructor(public box: Box, direction: "vertical" | "horizontal", drawStaffLines = false) {
    if (direction == "vertical") {
      this.startAttribute = "y";
      this.endAttribute = "bottom";
      this.dimensionAttribute = "height";
    } else {
      this.startAttribute = "x";
      this.endAttribute = "right";
      this.dimensionAttribute = "width";
      this.drawStaffLines = drawStaffLines;
    }
  }

  tryAddElement(element: T) {
    const lastElement = last(this.elements);
    if (lastElement) {
      if (lastElement.box[this.endAttribute] + element.box[this.dimensionAttribute] > this.box[this.endAttribute]) {
        return false;
      }

      // TODO figure out how to make TypeScript happy here without the `as any`
      (element.box as any)[this.startAttribute] = lastElement.box[this.endAttribute];
    }

    this.elements.push(element);
    return true;
  }

  addElement(element: T) {
    const lastElement = last(this.elements);
    if (lastElement) {
      (element.box as any)[this.startAttribute] = lastElement.box[this.endAttribute];
    }
    this.elements.push(element);
  }

  /** Reposition and scale all inner elements so that they fill this flex group's box  */
  public layout() {
    const farthest = maxBy(this.elements, `box.${this.endAttribute}`);
    if (!farthest) {
      return;
    }

    const stretchFactor = this.box[this.dimensionAttribute] / farthest.box[this.endAttribute];

    let start = 0;
    for (const element of this.elements) {
      (element.box as any)[this.startAttribute] = start;
      (element.box as any)[this.dimensionAttribute] *= stretchFactor; // TODO eventually, BarLine may have width, but doesn't want to be stretched
      start += element.box[this.dimensionAttribute];
    }
  }
}
