import * as layout from "../../../layout";
import { Text } from "./Text";

export const Note = (context: CanvasRenderingContext2D, element: layout.Note) => {
  if (element.note.tie && element.note.tie.type !== "start") {
    return;
  }

  const text = element.note.toString();
  if (text.length === 0) {
    return;
  }

  // const { playback } = useApplicationState();
  // const playNote = () => {
  //   playback.playSelectedNote();
  // };

  Text(context, {
    box: element.box,
    halign: "center",
    valign: "center",
    size: element.box.height,
    text,
    fill: true,
  });
};
