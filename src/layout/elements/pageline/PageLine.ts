import { memoize, range } from "lodash";
import { STAFF_LINE_HEIGHT } from "../../constants";
import { FlexGroupElement } from "../../layouts/FlexGroup";
import { SimpleGroup } from "../../layouts/SimpleGroup";
import { LineElement, Measure, Page } from "../../types";
import { maxMap } from "../../utils";
import { Box } from "../../utils/Box";
import { BarLine } from "../BarLine";
import { Line } from "../Line";
import { Space } from "../Space";
import { Text } from "../Text";
import { AboveStaff } from "./AboveStaff";
import { BelowStaff } from "./BelowStaff";
import { StaffOverlay } from "./StaffOverlay";

// TODO this is almost a vertical flexgroup, if we could figure out what to do with the staff overlay

export class PageLine extends SimpleGroup<LineElement, "PageLine", Page> {
  readonly type = "PageLine";

  private aboveStaffLayout: AboveStaff;
  private staffLayout: FlexGroupElement<LineElement>;
  private belowStaff: BelowStaff;
  private staffLines: Line[] = [];
  private staffOverlay: StaffOverlay;
  private dirty = true;

  public measures: Measure[] = [];

  constructor(box: Box, private numStaffLines = 6) {
    super(box);

    this.staffOverlay = new StaffOverlay();
    this.aboveStaffLayout = new AboveStaff(STAFF_LINE_HEIGHT * 0.25);
    this.staffLayout = new FlexGroupElement<LineElement>({ box: box.clone(), crossAxisAlignment: "center" });
    this.belowStaff = new BelowStaff();

    this.initializeElements();
  }

  addBarLine() {
    this.addElement(new BarLine(this.numStaffLines || 6), 0);
  }

  reset() {
    super.reset();
    this.measures = [];
  }

  private initializeElements() {
    this.staffLines = range(this.numStaffLines).map((_index) => {
      const line = new Line(Box.empty(), "#888888");
      super.addElement(line);
      return line;
    });

    super.addElement(this.staffOverlay);
    super.addElement(this.aboveStaffLayout);
    super.addElement(this.staffLayout);
    super.addElement(this.belowStaff);

    this.addBarLine();
    this.addElement(this.createTabGroup(), 0);
  }

  addElement(element: LineElement, factor?: number) {
    if (element.type == "Measure") {
      this.measures.push(element);
    }

    this.dirty = true;
    return this.staffLayout.addElement(element, factor);
  }

  tryAddElement(element: LineElement, factor?: number) {
    const wasAdded = this.staffLayout.tryAddElement(element, factor);
    if (wasAdded && element.type == "Measure") {
      this.measures.push(element);
    }
    this.dirty ||= wasAdded;
    return wasAdded;
  }

  layout() {
    if (!this.dirty) {
      return;
    }

    this.staffLayout.layout();
    this.staffLayout.box.height = maxMap(this.staffLayout.children, (c) => c.box.height) ?? 0;

    const elements = this.gridLayoutElements();
    this.staffOverlay.setStaffElements(elements);
    this.staffOverlay.reset();
    this.staffOverlay.box = this.staffLayout.box.clone();
    this.aboveStaffLayout.setStaffElements(elements);
    this.belowStaff.setMeasures(this.measures);

    this.staffOverlay.layout();
    this.aboveStaffLayout.layout();
    this.belowStaff.layout();

    // Finalize positions
    this.staffLayout.box.y = this.aboveStaffLayout.box.bottom;
    this.belowStaff.box.y = this.staffLayout.box.bottom;
    this.staffOverlay.box.y = this.staffLayout.box.y;

    this.staffLines.forEach((line, index) => {
      line.box.width = this.box.width;
      line.box.y = this.staffLayout.box.y + (index + 0.5) * STAFF_LINE_HEIGHT;
    });

    this.box.width = maxMap(this.children, (e) => e.box.width) ?? 0;
    this.box.height = this.belowStaff.box.bottom;
    this.dirty = false;
  }

  private createTabGroup() {
    const size = 0.25 * this.numStaffLines * STAFF_LINE_HEIGHT;
    const width = 2 * STAFF_LINE_HEIGHT;

    const group = new FlexGroupElement<Text | Space>({
      box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, width, STAFF_LINE_HEIGHT * (this.numStaffLines - 1)),
      axis: "vertical",
      mainAxisSpaceDistribution: "center",
      defaultStretchFactor: 0,
    });

    for (const value of ["T", "A", "B"]) {
      group.addElement(
        Text.centered({
          box: new Box(0, 0, width, size),
          size,
          value,
          style: {
            userSelect: "none",
          },
        })
      );
    }

    return group;
  }

  /**
   * Get the elements that influence the grid layout used for above staff decorations.
   *
   * Note that these establish the right edges of the columns. That means that the column in the grid group that corresponds
   * to the element in the array we return is actually one more than the index of that element.
   */
  private gridLayoutElements = memoize(() => {
    return this.measures.flatMap((measure) => {
      return measure.children.map((element) => ({ element, measure }));
    });
  });
}
