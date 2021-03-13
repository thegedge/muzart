import React from "react";
import * as layout from "../layout";
import { svgPositionProps, svgPositionTransform } from "./utils";

export function Measure(props: { measure: layout.Measure }) {
  return (
    <g transform={svgPositionTransform(props.measure)}>
      {props.measure.elements.map((chord) => {
        if (chord.type === "Space") {
          return;
        }

        return <Chord chord={chord} />;
      })}
    </g>
  );
}

export function Chord(props: { chord: layout.Chord }) {
  return (
    <g transform={svgPositionTransform(props.chord)}>
      {props.chord.notes.map((note) => (
        <Note note={note} />
      ))}
    </g>
  );
}

export function Note(props: { note: layout.Note }) {
  const note = props.note;
  return (
    <>
      <rect {...svgPositionProps(note)} width={note.box.height} height={note.box.height} fill="white" />
      <text
        x={note.box.x + 0.5 * note.box.height}
        y={note.box.centerY}
        dominantBaseline="central"
        textAnchor="middle"
        style={{ fontSize: note.box.height, lineHeight: note.box.height }}
      >
        {note.note.fret?.fret}
      </text>
    </>
  );
}
