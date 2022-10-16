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

  const size = element.box.width / Math.max(topDigits.length, bottomDigits.length);
  const spacing = element.box.height - 2 * size;

  // Height must be `size`, but scale the width proportionally
  const topDigitElements = topDigits.map((digit) => timeSignatureDigit(digit, undefined, size));
  const bottomDigitElements = bottomDigits.map((digit) => timeSignatureDigit(digit, undefined, size));

  const topOffsetX = element.box.centerX - 0.5 * (topDigits.length * size);
  const bottomOffsetX = element.box.centerX - 0.5 * (bottomDigits.length * size);

  context.fillStyle = "#000000";

  topDigitElements.map(({ path, scaleX, scaleY }, index) => {
    context.save();
    context.translate(element.box.x + topOffsetX + scaleX * (index * size), element.box.y);
    context.scale(scaleX, scaleY);
    context.fill(new Path2D(path));
    context.restore();
  });

  bottomDigitElements.map(({ path, scaleX, scaleY }, index) => {
    context.save();
    context.translate(element.box.x + bottomOffsetX + scaleX * (index * size), element.box.y + spacing + size);
    context.scale(scaleX, scaleY);
    context.fill(new Path2D(path));
    context.restore();
  });
};
