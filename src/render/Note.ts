import layout from "../layout";
import { renderScoreElement } from "./renderScoreElement";
import { RenderFunc } from "./types";

export const Note: RenderFunc<layout.Note> = (element, render, context) => {
  if (element.note.tie && element.note.tie.type !== "start") {
    return;
  }

  const text = element.note.toString();
  if (text.length === 0) {
    return;
  }

  // TODO move this to layout
  renderScoreElement(
    {
      type: "Text",
      parent: null,
      box: element.box,
      size: element.box.height,
      text,
      style: {
        textAlign: "center",
        verticalAlign: "middle",
        backgroundColor: "#ffffff",
      },
    },
    render,
    context,
  );
};
