import React from "react";
import * as layout from "../../layout";
import { TextElement } from "./TextElement";

export function Note(props: { note: layout.Note }) {
  const text = props.note.note.toString();
  if (text.length === 0) {
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
