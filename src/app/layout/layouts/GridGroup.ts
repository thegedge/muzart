import { find, last, partition, range, some, zip } from "lodash";
import { HasBox } from "../types";
import Box from "../utils/Box";
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
export class GridGroup<T extends MaybeLayout<HasBox>> {
  readonly type: "Group" = "Group";

  public box = new Box(0, 0, 0, 0);
  public elements: T[] = [];
  private constraints: Constraint[] = [];
  private edges: number[] = [];

  constructor(private spacing = 0) {}

  addElement(element: T, constraint: Constraint) {
    this.elements.push(element);
    this.constraints.push(constraint);
  }

  reset() {
    this.elements = [];
    this.constraints = [];
    this.box = new Box(0, 0, 0, 0);
  }

  /**
   * Set the x positions of the right edge for each cell in the grid.
   *
   * @param edges edge positions
   */
  setRightEdges(edges: number[]) {
    this.edges = [0].concat(edges);
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
      columns: range(this.edges.length).map(() => false),
      elements: [] as T[],
    });
    const rows = [newRow()];

    // Now, lay out everything else
    for (const [element, constraint] of everythingElse) {
      element.box.x = this.edges[constraint.startColumn];
      element.box.width = this.edges[constraint.endColumn + 1] - element.box.x;

      if (element.layout) {
        element.layout();
      }

      // If the span of cells we need don't exist, create a new row
      let row = find(rows, (row) => {
        return !some(row.columns.slice(constraint.startColumn, constraint.endColumn + 1));
      });

      if (!row) {
        row = newRow();
        rows.push(row);
      }

      row.columns.fill(true, constraint.startColumn, constraint.endColumn + 1);
      row.elements.push(element);
    }

    if (mustBeBottomRow.length > 0) {
      rows.unshift(newRow());

      for (const [element, constraint] of mustBeBottomRow) {
        element.box.x = this.edges[constraint.startColumn];
        element.box.width = this.edges[constraint.endColumn + 1] - element.box.x;

        if (element.layout) {
          element.layout();
        }

        rows[0].columns.fill(true, constraint.startColumn, constraint.endColumn + 1);
        rows[0].elements.push(element);
      }
    }

    return rows.reverse();
  }
}
