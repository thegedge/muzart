import layout from "../layout";
import { Text } from "./Text";
import { RenderFunc } from "./types";

export const Note: RenderFunc<layout.Note> = (element, render, context) => {
  if (element.note.tie && element.note.tie.type !== "start") {
    return;
  }

  const text = element.note.toString();
  if (text.length === 0) {
    return;
  }

  Text(
    {
      box: element.box,
      halign: "center",
      valign: "center",
      size: element.box.height,
      text,
      style: {
        backgroundColor: "#ffffff",
      },
    },
    render,
    context,
  );
};
