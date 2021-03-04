import { clamp, isArray } from "lodash";
import React from "react";
import { Chord, Measure, StaffDetails } from "../notation";

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
    chordComponents = <StaffChord />;
  } else {
    chordComponents = props.measure.chords.map((chord, index) => <StaffChord key={index} chord={chord} />);
  }

  // TODO the background line approach to styling a staff makes it hard to work with

  // TODO Properly handle multiple staves
  const measure = (
    <div className="flex flex-row flex-1 my-4" style={{ minWidth }}>
      {props.measure.staveDetails && props.measure.staveDetails[0] && (
        <StaffDetails staff={props.measure.staveDetails[0]} />
      )}
      <MeasureLine negative />
      <div className="flex flex-1 flex-row">
        <StaffChord key="pad-left" className="flex-initial w-4" />
        {chordComponents}
        <StaffChord key="pad-right" className="flex-initial w-4" />
      </div>
      <MeasureLine />
    </div>
  );

  return measure;
}

function StaffDetails(props: { staff: StaffDetails }) {
  return (
    <>
      {/* {props.staff.clef && TODO} */}
      {/* {props.staff.key && TODO} */}
      {props.staff.time && (
        <div className="inline-grid grid-rows-2 text-2xl font-bold px-4 py-2">
          <div className="flex flex-col justify-center">{props.staff.time.beats}</div>
          <div className="flex flex-col justify-center">{props.staff.time.beatType}</div>
        </div>
      )}
    </>
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

function StaffChord(props: { chord?: Chord; className?: string }) {
  const notes: (number | string)[] = [" ", " ", " ", " ", " ", " "];
  let flexGrow = 1;
  if (isArray(props.chord)) {
    flexGrow = props.chord[0].duration;
    for (const note of props.chord) {
      if (note.placement) {
        notes[note.placement.string - 1] = note.placement.fret;
      }
    }
  } else if (props.chord && props.chord.placement) {
    flexGrow = props.chord.duration;
    notes[props.chord.placement.string - 1] = props.chord.placement.fret;
  }

  return (
    <div className={props.className} style={{ flexGrow }}>
      {notes.map((note, index) => {
        return (
          <div key={index} className="background-center-line">
            <div className="inline-block bg-white">{note}</div>
          </div>
        );
      })}
    </div>
  );
}
