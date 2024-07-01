import { every, last, zip } from "lodash";
import { Alignment } from "..";
import type { AnyLayoutElement } from "../elements/LayoutElement";
import { maxMap } from "../utils";
import { AbstractGroup } from "./AbstractGroup";
import type { Box } from "../utils/Box";

export interface Options {
  /** The initial box for the group */
  box?: Box;

  /** The gap between elements */
  gap?: number;
}

export interface Constraint {
  /** Column must be in the bottom row of the grid group */
  mustBeBottomRow?: boolean;

  /** Start column consumed by this element */
  startColumn: number;

  /** End column consumed by this element (inclusive) */
  endColumn: number;

  /** An optional grouping, such only other elements with this group will end up on the same row */
  group?: string;

  /** If set, align the element horizontally in the cell instead of stretching */
  halign?: Alignment;

  /** If set, align the element vertically in the cell instead of stretching */
  valign?: Alignment;
}

interface Row<T extends AnyLayoutElement> {
  columnAvailability: boolean[];
  elements: [T, Constraint][];
}

/**
 * A group that lays its elements out in a grid pattern, dynamically creating rows such that elements don't overlap.
 */
export class GridGroup<ChildrenT extends AnyLayoutElement> extends AbstractGroup<"Group", ChildrenT> {
  readonly type = "Group";

  private constraints: Constraint[] = [];
  private leftEdges: number[] = [];
  private gap: number;

  constructor(options?: Options) {
    super(options?.box);
    this.gap = options?.gap ?? 0;
  }

  addElement(element: ChildrenT, constraint: Constraint) {
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
          case "center":
            element.box.y = y + 0.5 * (maxHeight - element.box.height);
            break;
          case "end":
            element.box.y = y + maxHeight - element.box.height;
            break;
        }
      }

      y += maxHeight + this.gap;
    }

    this.box.x = 0;
    this.box.y = 0;
    this.box.height = y - this.gap;
  }

  private newRow(): Row<ChildrenT> {
    return {
      columnAvailability: new Array(this.leftEdges.length).fill(true),
      elements: [],
    };
  }

  private addElementToRow(row: Row<ChildrenT>, element: ChildrenT, constraint: Constraint) {
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
      case "center":
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
    // Order elements such that mustBeBottomRow comes first, then grouped elements, then everything else. This ensures
    // mustBeBottom row elements are on the bottom row, grouped elements prefer being on the same row, and everything
    // else fills in the gaps.
    const zipped = zip(this.children, this.constraints) as [ChildrenT, Constraint][]; // cast away the `undefined`, lengths are guaranteed to be the same
    zipped.sort(([_a, constraintA], [_b, constraintB]) => {
      const bottomA = constraintA.mustBeBottomRow;
      const bottomB = constraintB.mustBeBottomRow;
      if (bottomA != bottomB) {
        return bottomA ? -1 : 1;
      }

      const groupA = constraintA.group;
      const groupB = constraintB.group;
      if (groupA) {
        return groupB ? groupA.localeCompare(groupB) : -1;
      }

      return groupB ? 1 : 0;
    });

    const bottomRow = this.newRow();
    const rows: Row<ChildrenT>[] = [];
    for (const [element, constraint] of zipped) {
      if (constraint.mustBeBottomRow) {
        this.addElementToRow(bottomRow, element, constraint);
        continue;
      }

      const start = constraint.startColumn;
      const end = constraint.endColumn + 1;
      let row = rows.find((row) => every(row.columnAvailability.slice(start, end)));
      if (!row) {
        row = this.newRow();
        rows.push(row);
      }

      this.addElementToRow(row, element, constraint);
    }

    return [...rows.reverse(), bottomRow];
  }
}
