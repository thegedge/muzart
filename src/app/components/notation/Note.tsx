import React, { useCallback } from "react";
import * as layout from "../../layout";
import { usePlayback } from "../utils/PlaybackContext";
import { svgBoxProps } from "../utils/svg";
import { TextElement } from "./TextElement";

export function Note(props: { note: layout.Note }) {
  const text = props.note.note.toString();
  if (text.length === 0) {
    return <></>;
  }

  const notePlayer = usePlayback();
  const playNote = useCallback(() => {
    notePlayer.playNote(props.note.note);
  }, [props.note]);

  return (
    <g {...svgBoxProps(props.note)} onClick={playNote}>
      <TextElement
        {...props.note}
        halign="middle"
        size={props.note.box.height}
        text={text}
        style={{ userSelect: "none" }}
        fill
      />
    </g>
  );
}
