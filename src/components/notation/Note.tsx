import React from "react";
import * as layout from "../../layout";
import { TextElement } from "./TextElement";

export function Note(props: { note: layout.Note }) {
  const note = props.note.note;

  let text;
  if (note.deadNote) {
    text = "x";
  } else if (note.tie === "stop") {
    text = ".";
  } else if (note.placement) {
    text = note.placement.fret.toString();
  } else {
    return <></>;
  }

  return (
    <TextElement
      {...props.note}
      align="center"
      size={props.note.box.height}
      text={text}
      style={{ userSelect: "none" }}
      fill
    />
  );
}
