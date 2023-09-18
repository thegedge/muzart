import layout from "../layout";
import { timeSignatureDigit } from "../ui/resources/time_signature_digits";
import { digits } from "../utils/digits";
import { RenderFunc } from "./types";

export const TimeSignature: RenderFunc<layout.TimeSignature> = (element, render) => {
  const topDigits = digits(element.timeSignature.count);
  const bottomDigits = digits(element.timeSignature.value.toNumber());

  const digitSize = element.box.width / Math.max(topDigits.length, bottomDigits.length);
  const topBottomGap = element.box.height - 2 * digitSize;

  // Height must be `size`, but scale the width proportionally
  const topDigitElements = topDigits.map((digit) => timeSignatureDigit(digit, undefined, digitSize));
  const bottomDigitElements = bottomDigits.map((digit) => timeSignatureDigit(digit, undefined, digitSize));

  const topOffsetX = 0.5 * (element.box.width - topDigits.length * digitSize);
  const bottomOffsetX = 0.5 * (element.box.width - bottomDigits.length * digitSize);

  topDigitElements.map(({ path, scaleX, scaleY }, index) => {
    render.save();
    render.translate(element.box.x + topOffsetX + index * digitSize, element.box.y);
    render.scale(scaleX, scaleY);
    render.fill(new Path2D(path));
    render.restore();
  });

  bottomDigitElements.map(({ path, scaleX, scaleY }, index) => {
    render.save();
    render.translate(element.box.x + bottomOffsetX + index * digitSize, element.box.y + topBottomGap + digitSize);
    render.scale(scaleX, scaleY);
    render.fill(new Path2D(path));
    render.restore();
  });
};
