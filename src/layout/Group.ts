import { last, maxBy } from "lodash";
import Box from "./Box";
import { HasBox } from "./types";

// TODO "space between" option
// TODO elements need to specify if a dimension should stretch or not
// TODO combine these into one thing, with getters for the relevant axis
export class HorizontalFlexGroup<T extends HasBox> {
  readonly type = "Group";
  readonly elements: T[] = [];

  constructor(public box: Box, readonly drawStaffLines = false) {}

  tryAddElement(element: T) {
    const lastElement = last(this.elements);
    if (lastElement) {
      if (lastElement.box.right + element.box.width > this.box.right) {
        return false;
      }

      element.box.x = lastElement.box.right;
    }

    this.elements.push(element);
    return true;
  }

  addElement(element: T) {
    const lastElement = last(this.elements);
    if (lastElement) {
      element.box.x = lastElement.box.right;
    }
    this.elements.push(element);
  }

  /** Reposition and scale all inner elements so that they fill this flex group's box  */
  public layout() {
    const farthest = maxBy(this.elements, "box.right");
    if (!farthest) {
      return;
    }

    const stretchFactor = this.box.width / farthest.box.right;

    let x = 0;
    for (const element of this.elements) {
      element.box.x = x;
      element.box.width *= stretchFactor; // TODO eventually, BarLine may have width, but doesn't want to be stretched
      x += element.box.width;
    }
  }
}

export class VerticalFlexGroup<T extends HasBox> {
  readonly type = "Group";
  readonly elements: T[] = [];

  constructor(public box: Box) {}

  tryAddElement(element: T) {
    const lastElement = last(this.elements);
    if (lastElement) {
      if (lastElement.box.bottom + element.box.height > this.box.bottom) {
        return false;
      }

      element.box.y = lastElement.box.bottom;
    }

    this.elements.push(element);
    return true;
  }

  addElement(element: T) {
    const lastElement = last(this.elements);
    if (lastElement) {
      element.box.y = lastElement.box.bottom;
    }

    this.elements.push(element);
  }

  /** Reposition and scale all inner elements so that they fill this flex group's box  */
  public layout() {
    const farthest = maxBy(this.elements, "box.bottom");
    if (!farthest) {
      return;
    }

    // const stretchFactor = this.box.height / farthest.box.bottom;

    let y = 0;
    for (const element of this.elements) {
      element.box.y = y;
      // element.box.height *= stretchFactor;
      y += element.box.height;
    }
  }
}
