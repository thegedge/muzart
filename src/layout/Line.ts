import { clone, map, max } from "lodash";
import Box from "./Box";
import { FlexProps, LineElementFlexGroup } from "./FlexGroup";
import { STAFF_LINE_HEIGHT } from "./layout";
import { NonNegativeGroup } from "./NonNegativeGroup";
import { DurationStem, LineElement, Text } from "./types";

export class Line {
  readonly type: "Group" = "Group";
  readonly elements: LineElement[] = [];

  private aboveStaffLayout: NonNegativeGroup<Text>;
  private staffLayout: LineElementFlexGroup;
  private belowStaffLayout: NonNegativeGroup<DurationStem>;

  constructor(readonly box: Box) {
    this.aboveStaffLayout = new NonNegativeGroup();
    this.staffLayout = new LineElementFlexGroup({ box: clone(box), drawStaffLines: true }); // TODO eliminate drawStaffLines from here
    this.belowStaffLayout = new NonNegativeGroup();

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

    const numberSize = 0.08;
    const tempoSize = 0.1; // TODO property of this class? Related to staff line height?

    for (const staffChild of this.staffLayout.elements) {
      if (staffChild.type !== "Measure") {
        continue;
      }

      //---------------------------------------------------------------------------------------------

      this.aboveStaffLayout.addElement({
        type: "Text",
        align: "center",
        box: new Box(staffChild.box.x - 0.5 * numberSize, numberSize, numberSize, numberSize),
        size: numberSize,
        value: staffChild.measure.number.toString(),
        style: {
          userSelect: "none",
          fill: "#888888",
        },
      });

      if (staffChild.measure.staffDetails.tempo?.changed) {
        this.aboveStaffLayout.addElement({
          type: "Text",
          align: "left",
          box: new Box(staffChild.box.x, -tempoSize * 0.5, staffChild.box.width, tempoSize),
          size: tempoSize,
          value: `♩﹦${staffChild.measure.staffDetails.tempo.value}`,
          style: {
            userSelect: "none",
            fontWeight: "bold",
          },
        });
      }

      //---------------------------------------------------------------------------------------------

      for (const measureChild of staffChild.elements) {
        switch (measureChild.type) {
          case "Chord":
          case "Rest": {
            // TODO need to figure out how to best center in a rest
            let offset = measureChild.box.x + 0.4 * STAFF_LINE_HEIGHT;
            if (measureChild.type === "Chord" && measureChild.notes.length > 0) {
              offset = measureChild.box.x + measureChild.notes[0].box.centerX;
            }

            this.belowStaffLayout.addElement({
              type: "DurationStem",
              duration: measureChild.chord.duration,
              // TODO Better way to center stem with center of notes in chord?
              box: new Box(staffChild.box.x + offset, STAFF_LINE_HEIGHT, measureChild.box.width, STAFF_LINE_HEIGHT * 2),
            });
          }
          default: {
            // do nothing
          }
        }
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
