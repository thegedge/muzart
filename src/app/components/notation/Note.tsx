import React from "react";
import * as layout from "../../layout";
import { Box } from "../../layout/utils/Box";
import { SelectableBoxGroup } from "../layout/SelectableBoxGroup";
import { usePlayback } from "../utils/PlaybackContext";
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

  return (
    <SelectableBoxGroup
      node={props.note}
      onClick={() => {
        playNote();
      }}
    >
      <TextElement
        box={new Box(0, 0, props.note.box.width, props.note.box.height)}
        halign="middle"
        valign="middle"
        size={props.note.box.height}
        text={text}
        style={{ userSelect: "none", cursor: "pointer" }}
        fill
      />
    </SelectableBoxGroup>
  );
});
