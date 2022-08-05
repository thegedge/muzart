import React from "react";
import layout from "../../../layout";
import { digits } from "../../../utils/digits";
import { timeSignatureDigits } from "../../resources/time_signature_digits";
import { BoxGroup } from "../layout/BoxGroup";

export const TimeSignature = (props: { node: layout.TimeSignature }) => {
  const topDigits = digits(props.node.timeSignature.count);
  const bottomDigits = digits(props.node.timeSignature.value.toNumber());

  const size = props.node.box.width / Math.max(topDigits.length, bottomDigits.length);
  const spacing = props.node.box.height - 2 * size;

  // Height must be `size`, but scale the width proportionally
  const topDigitElements = topDigits.map((digit) => timeSignatureDigits(digit, undefined, size));
  const bottomDigitElements = bottomDigits.map((digit) => timeSignatureDigits(digit, undefined, size));

  const topOffsetX = 0.5 * (props.node.box.width - topDigits.length * size);
  const bottomOffsetX = 0.5 * (props.node.box.width - bottomDigits.length * size);

  return (
    <BoxGroup node={props.node}>
      {topDigitElements.map((d, index) => (
        <g key={index} transform={`translate(${topOffsetX + index * size} 0)`}>
          {d}
        </g>
      ))}
      {bottomDigitElements.map((d, index) => (
        <g key={index} transform={`translate(${bottomOffsetX + index * size} ${spacing + size})`}>
          {d}
        </g>
      ))}
    </BoxGroup>
  );
};
