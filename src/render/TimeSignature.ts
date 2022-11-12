import layout from "../layout";
import { timeSignatureDigit } from "../ui/resources/time_signature_digits";
import { Application } from "../ui/state/Application";
import { digits } from "../utils/digits";

export const TimeSignature = (
  _application: Application,
  context: CanvasRenderingContext2D,
  element: layout.TimeSignature
) => {
  const topDigits = digits(element.timeSignature.count);
  const bottomDigits = digits(element.timeSignature.value.toNumber());

  const digitSize = element.box.width / Math.max(topDigits.length, bottomDigits.length);
  const topBottomGap = element.box.height - 2 * digitSize;

  // Height must be `size`, but scale the width proportionally
  const topDigitElements = topDigits.map((digit) => timeSignatureDigit(digit, undefined, digitSize));
  const bottomDigitElements = bottomDigits.map((digit) => timeSignatureDigit(digit, undefined, digitSize));

  const topOffsetX = 0.5 * (element.box.width - topDigits.length * digitSize);
  const bottomOffsetX = 0.5 * (element.box.width - bottomDigits.length * digitSize);

  context.fillStyle = "#000000";

  topDigitElements.map(({ path, scaleX, scaleY }, index) => {
    context.save();
    context.translate(element.box.x + topOffsetX + index * digitSize, element.box.y);
    context.scale(scaleX, scaleY);
    context.fill(new Path2D(path));
    context.restore();
  });

  bottomDigitElements.map(({ path, scaleX, scaleY }, index) => {
    context.save();
    context.translate(element.box.x + bottomOffsetX + index * digitSize, element.box.y + topBottomGap + digitSize);
    context.scale(scaleX, scaleY);
    context.fill(new Path2D(path));
    context.restore();
  });
};
