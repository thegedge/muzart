import React from "react";
import * as layout from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { SelectableBoxGroup } from "../layout/SelectableBoxGroup";
import { TextElement } from "./TextElement";

export const Note = (props: { element: layout.Note }) => {
  if (props.element.note.tie && props.element.note.tie.type !== "start") {
    return null;
  }

  const text = props.element.note.toString();
  if (text.length === 0) {
    return null;
  }

  const { playback } = useApplicationState();
  const playNote = () => {
    playback.playSelectedNote();
  };

  return (
    <SelectableBoxGroup element={props.element} onClick={playNote}>
      <TextElement
        box={new Box(0, 0, props.element.box.width, props.element.box.height)}
        halign="center"
        valign="center"
        size={props.element.box.height}
        text={text}
        style={{ userSelect: "none", cursor: "pointer" }}
        fill
      />
    </SelectableBoxGroup>
  );
};
