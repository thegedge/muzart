import { STAFF_LINE_HEIGHT } from "..";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils/Box";
import { Arc } from "./Arc";
import { Line } from "./Line";

export class Slide extends SimpleGroup<"Slide", Arc | Line> {
  readonly type = "Slide";

  constructor(
    box: Box,
    readonly upwards: boolean,
  ) {
    super(box);

    // TODO specify line colors below in score.css

    let line: Line;
    if (upwards) {
      line = new Line(new Box(0, 0, box.width, box.height));
    } else {
      line = new Line(new Box(box.width, box.height, 0, 0));
    }

    line.style.stroke = "#555555";
    this.addElement(line);

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
