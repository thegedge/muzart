import React from "react";
import * as layout from "../../layout";
import { Chord, getParentOfType, Measure } from "../../layout";
import { usePlayback } from "../utils/PlaybackContext";
import { useWriteSelection } from "../utils/SelectionContext";
import { svgBoxProps } from "../utils/svg";
import { TextElement } from "./TextElement";

export const Note = React.memo(function Note(props: { note: layout.Note }) {
  const text = props.note.note.toString();
  if (text.length === 0) {
    return <></>;
  }

  const notePlayer = usePlayback();
  const playNote = () => {
    notePlayer.playNote(props.note.note);
  };

  const { updateSelection } = useWriteSelection();
  const setSelectionOnClick = () => {
    const chord = getParentOfType<Chord>(props.note, "Chord");
    const measure = getParentOfType<Measure>(chord, "Measure");
    updateSelection({ measure: measure?.measure.number });
  };

  return (
    <g
      {...svgBoxProps(props.note)}
      onClick={() => {
        playNote();
        setSelectionOnClick();
      }}
    >
      <TextElement
        {...props.note}
        halign="middle"
        valign="middle"
        size={props.note.box.height}
        text={text}
        style={{ userSelect: "none" }}
        fill
      />
    </g>
  );
});
