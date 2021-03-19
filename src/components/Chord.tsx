import React from "react";
import * as layout from "../layout";
import { BoxGroup } from "./BoxGroup";
import { TextElement } from "./TextElement";

export function Chord(props: { chord: layout.Chord }) {
  return (
    <BoxGroup node={props.chord}>
      {props.chord.notes.map((note) => (
        <Note note={note} />
      ))}
    </BoxGroup>
  );
}

export function Note(props: { note: layout.Note }) {
  const note = props.note;
  if (!note.note.placement) {
    return <></>;
  }

  return (
    <TextElement {...note} align="center" size={note.box.height} text={note.note.placement.fret.toString()} fill />
  );
}
