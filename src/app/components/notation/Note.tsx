import React from "react";
import * as layout from "../../layout";
import { Box } from "../../layout/utils/Box";
import { SelectableBoxGroup } from "../layout/SelectableBoxGroup";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { TextElement } from "./TextElement";

export const Note = React.memo(function Note(props: { note: layout.Note }) {
  if (props.note.note.tie && props.note.note.tie.type !== "start") {
    return null;
  }

  const text = props.note.note.toString();
  if (text.length === 0) {
    return null;
  }

  const { playback } = useApplicationState();
  const playNote = () => {
    playback.playSelectedNote();
  };

  return (
    <SelectableBoxGroup node={props.note} onClick={playNote}>
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
