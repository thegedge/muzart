import { clamp, isArray, max, min } from "lodash";
import React from "react";
import { Chord, Measure } from "../notation";

export default function MeasureRow(props: { measures: Measure[] }) {
  return (
    <div className="flex flex-row flex-wrap leading-tight">
      {props.measures.map((measure, index) => (
        <Measure key={index} measure={measure} />
      ))}
    </div>
  );
}

function Measure(props: { measure: Measure }) {
  const minWidth = `${clamp(props.measure.chords.length * 2.5, 10, 40)}em`;

  let chordComponents;
  if (props.measure.chords.length == 0) {
    chordComponents = <Chord />;
  } else {
    chordComponents = props.measure.chords.map((chord, index) => <Chord key={index} chord={chord} />);
  }

  return (
    <div className="flex flex-row flex-1 my-4" style={{ minWidth }}>
      <MeasureLine negative />
      <div className="flex flex-1 flex-row">{chordComponents}</div>
      <MeasureLine />
    </div>
  );
}

// These aren't great right now, but I'll likely have to do my own layout eventually, which will make it easier to put
// borders on the measures.
function MeasureLine(props: { negative?: boolean }) {
  const marginY = "calc(0.6rem - 1px)";
  const marginX = props.negative ? "-1px" : "";
  const margin = `${marginY} 0 ${marginY} ${marginX}`;
  return <div className={`bg-black w-px flex-initial`} style={{ margin }} />;
}

function Chord(props: { chord?: Chord }) {
  const notes: (number | string)[] = [" ", " ", " ", " ", " ", " "];
  if (isArray(props.chord)) {
    for (const note of props.chord) {
      notes[note.string - 1] = note.fret;
    }
  } else if (props.chord) {
    notes[props.chord.string - 1] = props.chord.fret;
  }

  return (
    <div className="flex-1">
      {notes.map((note, index) => (
        <div key={index} className="background-center-line text-center">
          <div className="inline-block bg-white">{note}</div>
        </div>
      ))}
    </div>
  );
}
