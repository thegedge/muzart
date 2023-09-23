import types, { STAFF_LINE_HEIGHT } from "..";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";
import { Arc } from "./Arc";
import { Line } from "./Line";

export class Slide extends SimpleGroup<types.Arc | types.Line, "Slide", types.LineElement> implements types.Slide {
  readonly type = "Slide";

  constructor(
    box: Box,
    readonly upwards: boolean,
  ) {
    super(box);

    // TODO specify line colors below in score.css

    if (upwards) {
      this.addElement(new Line(new Box(0, 0, box.width, box.height), "#555555"));
    } else {
      this.addElement(new Line(new Box(box.width, box.height, 0, 0), "#555555"));
    }

    this.addElement(
      new Arc(
        new Box(-0.5 * STAFF_LINE_HEIGHT, -STAFF_LINE_HEIGHT, box.width + STAFF_LINE_HEIGHT, 0.8 * STAFF_LINE_HEIGHT),
        "above",
      ),
    );
  }

  layout(): void {
    // TODO make this unnecessary
  }
}
