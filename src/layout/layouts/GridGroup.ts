import { every, find, last, partition, zip } from "lodash";
import types, { Alignment } from "..";
import { Box, maxMap } from "../utils";
import { AbstractGroup } from "./AbstractGroup";

export interface Constraint {
  /** Column must be in the bottom row of the grid group */
  mustBeBottomRow?: boolean;

  /** Start column consumed by this element */
  startColumn: number;

  /** End column consumed by this element (inclusive) */
  endColumn: number;

  /** An optional row key, such that only children with the given key can be found on the same row */
  group?: string;

  /** If set, align the element horizontally in the cell instead of stretching */
  halign?: Alignment;

  /** If set, align the element vertically in the cell instead of stretching */
  valign?: Alignment;
}

interface Row<T extends types.LayoutElement> {
  columnAvailability: boolean[];
  elements: [T, Constraint][];
  group?: string | undefined;
}

/**
 * TBD
 */
export class GridGroup<T extends types.LayoutElement> extends AbstractGroup<T> {
  readonly type = "Group";

  private constraints: Constraint[] = [];
  private leftEdges: number[] = [];

  constructor(private readonly spacing = 0) {
    super(Box.empty());
  }

  addElement(element: T, constraint: Constraint) {
    element.parent = this;
    this.children.push(element);
    this.constraints.push(constraint);
  }

  reset() {
    super.reset();
    this.constraints.length = 0;
    this.leftEdges.length = 0;
  }

  /**
   * Set up the columns by specifying the right edges of each.
   *
   * @param edges edges array
   */
  setRightEdges(edges: ReadonlyArray<number>) {
    this.leftEdges = [0, ...edges.slice(0, -1)];
    this.box.width = last(edges) ?? 0;
  }

  layout() {
    let y = 0;
    for (const row of this.determineRows()) {
      const maxHeight = maxMap(row.elements, (elements) => elements[0].box.height) ?? 0;
      for (const [element, constraint] of row.elements) {
        switch (constraint.valign) {
          case undefined:
            element.box.y = y;
            element.box.height = maxHeight;
            break;
          case "start":
            element.box.y = y;
            break;
          case "middle":
            element.box.y = y + 0.5 * (maxHeight - element.box.height);
            break;
          case "end":
            element.box.y = y + maxHeight - element.box.height;
            break;
        }
      }

      y += maxHeight + this.spacing;
    }

    this.box.x = 0;
    this.box.y = 0;
    this.box.height = y - this.spacing;
  }

  private newRow(group?: string): Row<T> {
    return {
      columnAvailability: new Array(this.leftEdges.length).fill(true),
      elements: [],
      group,
    };
  }

  private addElementToRow(row: Row<T>, element: T, constraint: Constraint) {
    const right = this.leftEdges[constraint.endColumn + 1] ?? this.box.width;
    const left = this.leftEdges[constraint.startColumn];

    switch (constraint.halign) {
      case undefined:
        element.box.x = left;
        element.box.width = right - left;
        break;
      case "start":
        element.box.x = left;
        break;
      case "middle":
        element.box.x = 0.5 * (right + left - element.box.width);
        break;
      case "end":
        element.box.x = right - element.box.width;
        break;
    }

    element.layout?.();

    row.columnAvailability.fill(false, constraint.startColumn, constraint.endColumn + 1);
    row.elements.push([element, constraint]);
  }

  private determineRows() {
    // TODO validate indices in constraints against `this.edges.length`
    // TODO allow elements not in the same group to be on the same row, but push to another row if an element from the same group should go there

    const rows = [this.newRow()];
    const zipped = zip(this.children, this.constraints) as [T, Constraint][];
    const [mustBeBottomRow, everythingElse] = partition(zipped, ([_, constraint]) => constraint.mustBeBottomRow);

    if (mustBeBottomRow.length > 0) {
      for (const [element, constraint] of mustBeBottomRow) {
        this.addElementToRow(rows[0], element, constraint);
      }

      rows[0].columnAvailability.fill(false); // ensure no one else can be on the bottom row (should they?)
      rows.unshift(this.newRow());
    }

    for (const [element, constraint] of everythingElse) {
      let row = find(rows, (row) => {
        return (
          constraint.group === row.group &&
          every(row.columnAvailability.slice(constraint.startColumn, constraint.endColumn + 1))
        );
      });

      if (!row) {
        row = this.newRow(constraint.group);
        rows.unshift(row);
      }

      this.addElementToRow(row, element, constraint);
    }

    return rows;
  }
}
