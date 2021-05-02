import { every, find, last, partition, range, zip } from "lodash";
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
  private edges: number[] = [];

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
   * Set the x positions of the left edge for each cell in the grid.
   *
   * @param edges edge positions
   */
  setLeftEdges(edges: number[]) {
    this.edges = Array.from(edges);
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
    this.box.width = last(this.edges) || 0;
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
      columnAvailability: range(this.edges.length).map(() => true),
      elements: [] as T[],
    });
    const rows = [newRow()];

    // Lay out everything that isn't the bottom row
    for (const [element, constraint] of everythingElse) {
      element.box.x = this.edges[constraint.startColumn];
      element.box.width = this.edges[constraint.endColumn + 1] - element.box.x;

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
        element.box.x = this.edges[constraint.startColumn];
        element.box.width = this.edges[constraint.endColumn + 1] - element.box.x;

        if (element.layout) {
          element.layout();
        }

        rows[0].columnAvailability.fill(false, constraint.startColumn, constraint.endColumn + 1);
        rows[0].elements.push(element);
      }
    }

    return rows.reverse();
  }
}
