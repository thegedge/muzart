import { clone, map, max } from "lodash";
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
    this.staffLayout.box.height = max(map(this.staffLayout.elements, "box.height"));

    // TODO have to reset everything because layout() could be called multiple times. This sucks though. Some ideas:
    //   1. Track whether or not the line is dirty, and then reset.
    //   2. Add the elements to the above/below staff layout once, but move them around.
    //   3. Constraint-based layouts (measure number is above the staff, anchored to the leftmost chord)
    this.aboveStaffLayout.reset();
    this.belowStaffLayout.reset();

    // Add tempos
    const numberSize = 0.08;
    const tempoSize = 0.1; // TODO property of this class? Related to staff line height?

    for (const element of this.staffLayout.elements) {
      if (element.type !== "Measure") {
        continue;
      }

      this.aboveStaffLayout.addElement({
        type: "Text",
        align: "center",
        box: new Box(element.box.x - 0.5 * numberSize, numberSize, numberSize, numberSize),
        size: numberSize,
        value: element.measure.number.toString(),
        style: {
          userSelect: "none",
          fill: "#888888",
        },
      });

      if (element.measure.staffDetails.tempo?.changed) {
        this.aboveStaffLayout.addElement({
          type: "Text",
          align: "left",
          box: new Box(element.box.x, -tempoSize * 0.5, element.box.width, tempoSize),
          size: tempoSize,
          value: `♩﹦${element.measure.staffDetails.tempo.value}`,
          style: {
            userSelect: "none",
            fontWeight: "bold",
          },
        });
      }
    }

    this.aboveStaffLayout.layout();
    this.belowStaffLayout.layout();

    // Finalize positions
    let y = 0;
    for (const element of this.elements) {
      element.box.y = y;
      y += element.box.height;
    }

    this.box.width = max(map(this.elements, "box.width"));
    this.box.height = y;
  }
}
