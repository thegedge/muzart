import React from "react";
import * as layout from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Note } from "./Note";

export function Chord(props: { chord: layout.Chord }) {
  return (
    <BoxGroup node={props.chord}>
      {props.chord.notes.map((note) => (
        <Note note={note} />
      ))}
    </BoxGroup>
  );
}
