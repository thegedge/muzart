import React, { useMemo } from "react";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { BoxGroup } from "../layout/BoxGroup";
import { Arc } from "./Arc";

export const Slide = (props: { node: layout.Slide }) => {
  const arc = useMemo<layout.Arc>(
    () => ({
      type: "Arc",
      parent: props.node.parent,
      box: new Box(
        -0.5 * STAFF_LINE_HEIGHT,
        -STAFF_LINE_HEIGHT,
        props.node.box.width + STAFF_LINE_HEIGHT,
        0.8 * STAFF_LINE_HEIGHT
      ),
      orientation: "above",
    }),
    [props]
  );

  const upwards = props.node.upwards;
  const slideLine = useMemo(() => {
    const strokeWidth = 1.5 * LINE_STROKE_WIDTH;
    if (upwards) {
      return (
        <line
          x1={0}
          y1={props.node.upwards ? 0 : props.node.box.height}
          x2={props.node.box.width}
          y2={props.node.upwards ? props.node.box.height : 0}
          stroke="#555555"
          strokeWidth={strokeWidth}
        />
      );
    } else {
      return (
        <line
          x1={5 * LINE_STROKE_WIDTH}
          y1={props.node.upwards ? props.node.box.height : 0}
          x2={props.node.box.width - 5 * LINE_STROKE_WIDTH}
          y2={props.node.upwards ? 0 : props.node.box.height}
          stroke="#555555"
          strokeWidth={strokeWidth}
        />
      );
    }
  }, [upwards]);

  return (
    <BoxGroup node={props.node}>
      {slideLine}
      <Arc element={arc} />
    </BoxGroup>
  );
};
