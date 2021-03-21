import { range } from "lodash";
import React from "react";
import { DurationStem, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../layout";
import { NoteValueName } from "../../notation/note_value";

// TODO quarter height is good for guitar tabs, but typically half for regular scores
const BEAM_HEIGHT = STAFF_LINE_HEIGHT / 4;
const STEM_BEAM_COLOR = "#333333";

export function StemBeam(props: { node: DurationStem }) {
  let numBeams = 0;
  switch (props.node.duration.name) {
    case NoteValueName.Eighth:
      numBeams = 1;
      break;
    case NoteValueName.Sixteenth:
      numBeams = 2;
      break;
    case NoteValueName.ThirtySecond:
      numBeams = 3;
      break;
    case NoteValueName.SixtyFourth:
      numBeams = 4;
      break;
  }

  return (
    <>
      <line
        x1={props.node.box.x}
        y1={props.node.box.y}
        x2={props.node.box.x}
        y2={props.node.box.bottom}
        stroke={STEM_BEAM_COLOR}
        strokeWidth={LINE_STROKE_WIDTH}
      />
      {range(numBeams).map((index) => (
        <rect
          x={props.node.box.x}
          y={props.node.box.bottom - BEAM_HEIGHT * (index * 1.5 + 1)}
          width={props.node.box.width / 4}
          height={BEAM_HEIGHT}
          fill={STEM_BEAM_COLOR}
        />
      ))}
    </>
  );
}
