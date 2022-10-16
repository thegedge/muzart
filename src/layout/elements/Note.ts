import types from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";
import { Text } from "./Text";

export class Note extends LayoutElement<"Note", types.Chord> implements types.Note {
  readonly type = "Note";

  constructor(box: Box, readonly note: notation.Note) {
    super(box);
  }

  render(context: CanvasRenderingContext2D): void {
    if (this.note.tie && this.note.tie.type !== "start") {
      return;
    }

    const text = this.note.toString();
    if (text.length === 0) {
      return;
    }

    new Text({
      box: this.box,
      halign: "center",
      valign: "center",
      size: this.box.height,
      value: text,
      fill: "#ffffff",
    }).render(context);
  }
}
