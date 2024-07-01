import * as notation from "@muzart/notation";
import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class TimeSignature extends LayoutElement<"TimeSignature"> {
  readonly type = "TimeSignature";

  constructor(readonly timeSignature: notation.TimeSignature) {
    const topDigits = Math.floor(Math.log10(timeSignature.count)) + 1;
    const bottomDigits = Math.floor(Math.log10(timeSignature.value.toNumber())) + 1;
    const width = STAFF_LINE_HEIGHT * 2 * Math.max(topDigits, bottomDigits);
    const gap = 4 * LINE_STROKE_WIDTH;
    super(new Box(0, 0, width, 4 * STAFF_LINE_HEIGHT + gap));
  }
}
