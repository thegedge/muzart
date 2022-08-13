import React from "react";
import layout, { Box, LINE_STROKE_WIDTH } from "../../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { TextElement } from "./TextElement";

export const DashedLineText = (props: { element: layout.DashedLineText }) => {
  // TODO need to have a better measurement of text instead of arbitrary multiplicative factor
  const textWidth = props.element.value.length * props.element.size * 0.6;

  let maybeDashedLine;
  if (textWidth < props.element.box.width) {
    const centerY = props.element.box.height * 0.5;
    maybeDashedLine = (
      <>
        <line
          x1={Math.min(textWidth, props.element.box.width)}
          x2={props.element.box.width}
          y1={centerY}
          y2={centerY}
          stroke="#333333"
          strokeDasharray={`${12 * LINE_STROKE_WIDTH} ${4 * LINE_STROKE_WIDTH}`}
        />
        <line
          x1={props.element.box.width}
          x2={props.element.box.width}
          y1={centerY - 0.5 * props.element.size}
          y2={centerY + 0.5 * props.element.size}
          stroke="#333333"
        />
      </>
    );
  }

  return (
    <BoxGroup node={props.element}>
      <TextElement
        box={new Box(0, 0, props.element.box.width, props.element.box.height)}
        size={props.element.size}
        text={props.element.value}
        halign="start"
        valign="center"
        style={{ fill: "#333333" }}
      />
      {maybeDashedLine}
    </BoxGroup>
  );
};
