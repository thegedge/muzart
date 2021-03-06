import { every, find, partition, sum, zip } from "lodash";
import { LayoutElement } from "../types";
import { AbstractGroup } from "./AbstractGroup";
import { MaybeLayout } from "./types";

export interface Constraint {
  /** Column must be in the bottom row of the grid group */
  mustBeBottomRow?: boolean;

  /** Start column consumed by this element */
  startColumn: number;

  /** End column consumed by this element (inclusive) */
  endColumn: number;

  /** An optional row key, such that only elements with the given key can be found on the same row */
  group?: string;
}

/**
 * TBD
 */
export class GridGroup<T extends MaybeLayout<LayoutElement>> extends AbstractGroup<T> {
  readonly type = "Group";

  private constraints: Constraint[] = [];
  private widths: ReadonlyArray<number> = [];
  private leftEdges: ReadonlyArray<number> = [];

  constructor(private spacing = 0) {
    super();
  }

  addElement(element: T, constraint: Constraint) {
    element.parent = this;
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

    this.box.width = sum(this.widths);
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
      return Math.max(0, width);
    });

    this.box.width = sum(this.widths);
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
        maxHeight = Math.max(maxHeight, element.box.height);
      }

      for (const element of row.elements) {
        // TODO it may be preferable to not size the element to the row, but to align it within the row (i.e., like valign)
        element.box.y = y;
        element.box.height = maxHeight;
      }

      y += maxHeight + this.spacing;
    }

    this.box.x = 0;
    this.box.y = 0;
    this.box.height = y - this.spacing;
  }

  private determineRows() {
    // TODO validate indices in constraints against `this.edges.length`
    // TODO a lot of this could be determined when adding a new element, instead of on demand

    const zipped = zip(this.elements, this.constraints) as [T, Constraint][];
    const [mustBeBottomRow, everythingElse] = partition(zipped, ([_, constraint]) => {
      return constraint.mustBeBottomRow;
    });

    const newRow = (group?: string) => ({
      columnAvailability: new Array(this.widths.length).fill(true),
      elements: [] as T[],
      group,
    });
    const rows = [newRow()];

    // Now the forced bottom row, if we have anything in it
    if (mustBeBottomRow.length > 0) {
      rows.unshift(newRow());

      for (const [element, constraint] of mustBeBottomRow) {
        const right = this.leftEdges[constraint.endColumn + 1] ?? this.box.width;
        element.box.x = this.leftEdges[constraint.startColumn];
        element.box.width = right - element.box.x;

        if (element.layout) {
          element.layout();
        }

        rows[0].columnAvailability.fill(false, constraint.startColumn, constraint.endColumn + 1);
        rows[0].elements.push(element);
      }
    }

    // Lay out everything that isn't the bottom row
    for (const [element, constraint] of everythingElse) {
      const right = this.leftEdges[constraint.endColumn + 1] ?? this.box.width;
      element.box.x = this.leftEdges[constraint.startColumn];
      element.box.width = right - element.box.x;

      if (element.layout) {
        element.layout();
      }

      // If the span of cells we need don't exist, create a new row
      let row = find(rows, (row) => {
        return (
          constraint.group === row.group &&
          every(row.columnAvailability.slice(constraint.startColumn, constraint.endColumn + 1))
        );
      });

      if (!row) {
        row = newRow(constraint.group);
        rows.push(row);
      }

      row.columnAvailability.fill(false, constraint.startColumn, constraint.endColumn + 1);
      row.elements.push(element);
    }

    return rows.reverse();
  }
}
