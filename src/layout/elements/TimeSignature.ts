import types, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { timeSignatureDigit } from "../../ui/resources/time_signature_digits";
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

  render(context: CanvasRenderingContext2D): void {
    const topDigits = digits(this.timeSignature.count);
    const bottomDigits = digits(this.timeSignature.value.toNumber());

    const size = this.box.width / Math.max(topDigits.length, bottomDigits.length);
    const spacing = this.box.height - 2 * size;

    // Height must be `size`, but scale the width proportionally
    const topDigitElements = topDigits.map((digit) => timeSignatureDigit(digit, undefined, size));
    const bottomDigitElements = bottomDigits.map((digit) => timeSignatureDigit(digit, undefined, size));

    const topOffsetX = this.box.centerX - 0.5 * (topDigits.length * size);
    const bottomOffsetX = this.box.centerX - 0.5 * (bottomDigits.length * size);

    context.fillStyle = "#000000";

    topDigitElements.map(({ path, scaleX, scaleY }, index) => {
      context.save();
      context.translate(this.box.x + topOffsetX + scaleX * (index * size), this.box.y);
      context.scale(scaleX, scaleY);
      context.fill(new Path2D(path));
      context.restore();
    });

    bottomDigitElements.map(({ path, scaleX, scaleY }, index) => {
      context.save();
      context.translate(this.box.x + bottomOffsetX + scaleX * (index * size), this.box.y + spacing + size);
      context.scale(scaleX, scaleY);
      context.fill(new Path2D(path));
      context.restore();
    });
  }
}
