import { STAFF_LINE_HEIGHT } from "../constants";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Vibrato extends LayoutElement<"Vibrato"> {
  readonly type = "Vibrato";

  constructor() {
    super(new Box(0, 0, 0, STAFF_LINE_HEIGHT));
  }
}
