import { isArray } from "lodash";
import React from "react";
import { Chord, Measure } from "../notation";

export default function MeasureRow(props: { measures: Measure[] }) {
  return (
    <>
      {props.measures.map((measure) => (
        <Measure measure={measure} />
      ))}
    </>
  );
}

function Measure(props: { measure: Measure }) {
  return (
    <div className="flex flex-row flex-1">
      {props.measure.chords.map((chord) => (
        <Chord chord={chord} />
      ))}
    </div>
  );
}

function Chord(props: { chord: Chord }) {
  const notes: (number | undefined)[] = [undefined, undefined, undefined, undefined, undefined, undefined];
  if (isArray(props.chord)) {
    for (const note of props.chord) {
      notes[note.string - 1] = note.fret;
    }
  } else {
    notes[props.chord.string - 1] = props.chord.fret;
  }

  return (
    <div className="grid grid-rows-6 flex-1">
      {notes.map((note) => (
        <div className="background-center-line text-center">
          <div className="inline-block bg-white px-0.5">{note}</div>
        </div>
      ))}
    </div>
  );
}
