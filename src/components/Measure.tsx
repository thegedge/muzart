import React from "react";
import { Measure } from "../layout/layout";
import { svgPositionProps, svgPositionTransform } from "./utils";

export default function Measure(props: { measure: Measure }) {
  return (
    <g transform={svgPositionTransform(props.measure)}>
      {props.measure.chords.map((chord) => (
        <g transform={svgPositionTransform(chord)}>
          {chord.notes.map((note) => (
            <>
              <rect {...svgPositionProps(note)} width={note.box.height} height={note.box.height} fill="white" />
              <text
                x={note.box.x + 0.5 * note.box.height}
                y={note.box.y + 0.5 * note.box.height}
                dominantBaseline="middle"
                textAnchor="middle"
                style={{ fontSize: note.box.height }}
              >
                {note.note.fret?.fret}
              </text>
            </>
          ))}
        </g>
      ))}
    </g>
  );
}
