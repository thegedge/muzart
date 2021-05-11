import React, { useMemo } from "react";
import { Arc as ArcElement, LINE_STROKE_WIDTH, Slide, STAFF_LINE_HEIGHT } from "../../layout";
import Box from "../../layout/utils/Box";
import { BoxGroup } from "../layout/BoxGroup";
import { Arc } from "./Arc";

export function Slide(props: { node: Slide }) {
  const arc = useMemo<ArcElement>(
    () => ({
      type: "Arc",
      box: new Box(
        -0.5 * STAFF_LINE_HEIGHT,
        props.node.box.height + 0.1 * STAFF_LINE_HEIGHT,
        props.node.box.width + STAFF_LINE_HEIGHT,
        0.8 * STAFF_LINE_HEIGHT
      ),
      orientation: props.node.upwards ? "below" : "above",
    }),
    [props]
  );

  return (
    <BoxGroup node={props.node}>
      <line
        x1={0}
        y1={props.node.upwards ? props.node.box.height : 0}
        x2={props.node.box.width}
        y2={props.node.upwards ? 0 : props.node.box.height}
        stroke="#555555"
        strokeWidth={2 * LINE_STROKE_WIDTH}
      />
      <Arc element={arc} />
    </BoxGroup>
  );
}
