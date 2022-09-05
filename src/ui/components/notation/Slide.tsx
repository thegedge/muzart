import React, { useMemo } from "react";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { BoxGroup } from "../layout/BoxGroup";
import { Arc } from "./Arc";

export const Slide = (props: { element: layout.Slide }) => {
  const arc = useMemo<layout.Arc>(
    () => ({
      type: "Arc",
      parent: props.element.parent,
      box: new Box(
        -0.5 * STAFF_LINE_HEIGHT,
        -STAFF_LINE_HEIGHT,
        props.element.box.width + STAFF_LINE_HEIGHT,
        0.8 * STAFF_LINE_HEIGHT
      ),
      orientation: "above",
    }),
    [props]
  );

  const upwards = props.element.upwards;
  const slideLine = useMemo(() => {
    const strokeWidth = 1.5 * LINE_STROKE_WIDTH;
    if (upwards) {
      return (
        <line
          x1={0}
          y1={props.element.upwards ? 0 : props.element.box.height}
          x2={props.element.box.width}
          y2={props.element.upwards ? props.element.box.height : 0}
          stroke="#555555"
          strokeWidth={strokeWidth}
        />
      );
    } else {
      return (
        <line
          x1={5 * LINE_STROKE_WIDTH}
          y1={props.element.upwards ? props.element.box.height : 0}
          x2={props.element.box.width - 5 * LINE_STROKE_WIDTH}
          y2={props.element.upwards ? 0 : props.element.box.height}
          stroke="#555555"
          strokeWidth={strokeWidth}
        />
      );
    }
  }, [upwards]);

  return (
    <BoxGroup element={props.element}>
      {slideLine}
      <Arc element={arc} />
    </BoxGroup>
  );
};
