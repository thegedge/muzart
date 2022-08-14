import types, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { digits } from "../../utils/digits";
import { Measure } from "../types";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class TimeSignature extends LayoutElement<"TimeSignature", Measure> implements types.TimeSignature {
  readonly type = "TimeSignature";

  constructor(readonly timeSignature: notation.TimeSignature) {
    const topDigits = digits(timeSignature.count);
    const bottomDigits = digits(timeSignature.value.toNumber());
    const width = STAFF_LINE_HEIGHT * 2 * Math.max(topDigits.length, bottomDigits.length);
    const gap = 4 * LINE_STROKE_WIDTH;
    super(new Box(0, 0, width, 4 * STAFF_LINE_HEIGHT + gap));
  }
}
