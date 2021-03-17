import { clone } from "lodash";
import Box from "./Box";
import { FlexProps, LineElementFlexGroup } from "./FlexGroup";
import { NonNegativeGroup } from "./NonNegativeGroup";
import { LineElement } from "./types";

export class Line {
  readonly type: "Group" = "Group";
  readonly elements: LineElement[] = [];

  private aboveStaffLayout: NonNegativeGroup<LineElement>;
  private staffLayout: LineElementFlexGroup;
  private belowStaffLayout: NonNegativeGroup<LineElement>;

  constructor(readonly box: Box) {
    this.aboveStaffLayout = new NonNegativeGroup<LineElement>();
    this.staffLayout = new LineElementFlexGroup({ box: clone(box), drawStaffLines: true }); // TODO eliminate drawStaffLines from here
    this.belowStaffLayout = new NonNegativeGroup<LineElement>();

    this.elements.push(this.aboveStaffLayout, this.staffLayout, this.belowStaffLayout);
  }

  addElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    return this.staffLayout.addElement(element, flexProps);
  }

  tryAddElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    return this.staffLayout.tryAddElement(element, flexProps);
  }

  layout() {
    this.staffLayout.layout(true);
  }
}
