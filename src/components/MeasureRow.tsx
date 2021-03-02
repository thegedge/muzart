import { isArray } from "lodash";
import React from "react";
import { Chord, Measure } from "../notation";

export default function MeasureRow(props: { measures: Measure[] }) {
  return (
    <div className="flex flex-row flex-wrap m-12">
      {props.measures.map((measure) => (
        <>
          <Measure measure={measure} />
        </>
      ))}
    </div>
  );
}

function Measure(props: { measure: Measure }) {
  const minWidth = `${props.measure.chords.length * 3}em`;
  return (
    <div className="flex flex-row flex-1 border-black my-4" style={{ minWidth }}>
      <MeasureLine negative />
      {props.measure.chords.map((chord) => (
        <Chord chord={chord} />
      ))}
      <MeasureLine />
    </div>
  );
}

function MeasureLine(props: { negative?: boolean }) {
  const marginY = "calc(0.75rem - 1px)";
  const marginX = props.negative ? "-1px" : "";
  const margin = `${marginY} 0 ${marginY} ${marginX}`;
  return <div className={`bg-black w-px flex-initial`} style={{ margin }} />;
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
          {note && <div className="inline-block bg-white px-0.5">{note}</div>}
        </div>
      ))}
    </div>
  );
}
