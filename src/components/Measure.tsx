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
              <rect {...svgPositionProps(note)} width={note.height} height={note.height} fill="white" />
              <text
                x={note.x + 0.5 * note.height}
                y={note.y + 0.5 * note.height}
                dominantBaseline="middle"
                textAnchor="middle"
                style={{ fontSize: note.height }}
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
