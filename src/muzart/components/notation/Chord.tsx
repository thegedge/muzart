import React from "react";
import * as layout from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Note } from "./Note";

export function Chord(props: { chord: layout.Chord }) {
  return (
    <BoxGroup node={props.chord}>
      {props.chord.notes.map((note, index) => (
        <Note key={index} note={note} />
      ))}
    </BoxGroup>
  );
}
