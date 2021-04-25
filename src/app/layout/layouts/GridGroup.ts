import { find, last, partition, range, some, zip } from "lodash";
import { HasBox } from "../types";
import Box from "../utils/Box";
import { MaybeLayout } from "./types";

export interface Constraint {
  mustBeBottomRow?: boolean;
  startColumn: number;
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
    // TODO validate indices in constraints against `this.edges.length`

    const zipped = zip(this.elements, this.constraints) as [T, Constraint][];
    const [mustBeBottomRow, everythingElse] = partition(zipped, ([_, constraint]) => {
      return constraint.mustBeBottomRow;
    });

    const newRow = (y: number) => ({
      columns: range(this.edges.length).map(() => false),
      y,
      height: 0,
    });

    const rows = [newRow(0)];

    let y = 0;
    for (const [element, constraint] of everythingElse) {
      const x = this.edges[constraint.startColumn];
      element.box.width = this.edges[constraint.endColumn + 1] - x;

      if (element.layout) {
        element.layout();
      }

      // Figure out if we need a new row
      let row = find(rows, (row) => {
        return !some(row.columns.slice(constraint.startColumn, constraint.endColumn + 1));
      });

      if (!row) {
        y += last(rows)!.height + this.spacing; // TODO maxHeight of last row
        row = newRow(y);
      }

      row.columns.fill(true, constraint.startColumn, constraint.endColumn + 1);
      row.height = Math.max(row.height, element.box.height);

      element.box.x = x;
      element.box.y = row.y;
    }

    y += last(rows)!.height + this.spacing;

    let maxBottomRowHeight = 0;
    for (const [element, constraint] of mustBeBottomRow) {
      const x = this.edges[constraint.startColumn];
      element.box.width = this.edges[constraint.endColumn + 1] - x;

      if (element.layout) {
        element.layout();
      }

      element.box.x = x;
      element.box.y = y;
      maxBottomRowHeight = Math.max(maxBottomRowHeight, element.box.height);
    }

    this.box.x = 0;
    this.box.y = 0;
    this.box.width = last(this.edges) || 0;
    this.box.height = y + maxBottomRowHeight;
  }
}
