import { every, find, partition, sum, zip } from "lodash";
import { HasBox } from "../types";
import { Group } from "./Group";
import { MaybeLayout } from "./types";

export interface Constraint {
  /** Column must be in the bottom row of the grid group */
  mustBeBottomRow?: boolean;

  /** Start column consumed by this element */
  startColumn: number;

  /** End column consumed by this element (inclusive) */
  endColumn: number;
}

/**
 * TBD
 */
export class GridGroup<T extends MaybeLayout<HasBox>> extends Group<T> {
  private constraints: Constraint[] = [];
  private widths: ReadonlyArray<number> = [];
  private leftEdges: ReadonlyArray<number> = [];

  constructor(private spacing = 0) {
    super();
  }

  addElement(element: T, constraint: Constraint) {
    this.elements.push(element);
    this.constraints.push(constraint);
  }

  reset() {
    super.reset();
    this.constraints = [];
  }

  /**
   * Set up the columns by specifying the widths of each.
   *
   * @param widths column widths array
   */
  setColumnWidths(widths: ReadonlyArray<number>) {
    this.widths = widths;

    let previousX = 0;
    this.leftEdges = widths.map((width) => {
      const x = previousX;
      previousX += width;
      return x;
    });
  }

  /**
   * Set up the columns by specifying the right edges of each.
   *
   * @param edges edges array
   */
  setRightEdges(edges: ReadonlyArray<number>) {
    const leftEdges = edges.slice(0, -1);
    leftEdges.unshift(0);
    this.leftEdges = leftEdges;

    let prevX = 0;
    this.widths = edges.map((x) => {
      const width = x - prevX;
      prevX = x;
      return width;
    });
  }

  /**
   * TBD
   */
  layout() {
    // Adjust y positions of all elements, based on the row they're in
    let y = 0;
    const rows = this.determineRows();
    for (const row of rows) {
      let maxHeight = 0;
      for (const element of row.elements) {
        element.box.y = y;
        maxHeight = Math.max(maxHeight, element.box.height);
      }

      y += maxHeight + this.spacing;
    }

    this.box.x = 0;
    this.box.y = 0;
    this.box.width = sum(this.widths);
    this.box.height = y - this.spacing;
  }

  private determineRows() {
    // TODO validate indices in constraints against `this.edges.length`
    // TODO a lot of this could be determined when adding a new element, instead of on demand

    const zipped = zip(this.elements, this.constraints) as [T, Constraint][];
    const [mustBeBottomRow, everythingElse] = partition(zipped, ([_, constraint]) => {
      return constraint.mustBeBottomRow;
    });

    const newRow = () => ({
      columnAvailability: new Array(this.widths.length).fill(true),
      elements: [] as T[],
    });
    const rows = [newRow()];

    // Lay out everything that isn't the bottom row
    for (const [element, constraint] of everythingElse) {
      element.box.x = this.leftEdges[constraint.startColumn];
      element.box.width = this.leftEdges[constraint.endColumn + 1] - element.box.x;

      if (element.layout) {
        element.layout();
      }

      // If the span of cells we need don't exist, create a new row
      let row = find(rows, (row) => {
        return every(row.columnAvailability.slice(constraint.startColumn, constraint.endColumn + 1));
      });

      if (!row) {
        row = newRow();
        rows.push(row);
      }

      row.columnAvailability.fill(false, constraint.startColumn, constraint.endColumn + 1);
      row.elements.push(element);
    }

    // Now the forced bottom row, if we have anything in it
    if (mustBeBottomRow.length > 0) {
      rows.unshift(newRow());

      for (const [element, constraint] of mustBeBottomRow) {
        element.box.x = this.leftEdges[constraint.startColumn];
        element.box.width = this.leftEdges[constraint.endColumn + 1] - element.box.x;

        if (element.layout) {
          element.layout();
        }

        rows[0].elements.push(element);
      }
    }

    return rows.reverse();
  }
}
