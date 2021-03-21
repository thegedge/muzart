import { range } from "lodash";
import React from "react";
import * as layout from "../../layout";
import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import LineElementComponent from "./LineElement";

const STAFF_LINE_COLOR = "#555555";

export function LineGroup(props: { node: layout.Group }) {
  return (
    <BoxGroup node={props.node}>
      {props.node.drawStaffLines &&
        range(6).map((staffLineIndex) => (
          <line
            x1={0}
            y1={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
            x2={props.node.box.width}
            y2={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
            stroke={STAFF_LINE_COLOR}
            strokeWidth={LINE_STROKE_WIDTH}
          />
        ))}
      {props.node.elements.map((e, index) => (
        <LineElementComponent key={index} element={e} />
      ))}
    </BoxGroup>
  );
}
