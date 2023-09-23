import types from "..";
import * as notation from "../../notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";
import { Text } from "./Text";

export class Note extends SimpleGroup<types.Text, "Note", types.Chord> implements types.Note {
  readonly type = "Note";

  constructor(
    box: Box,
    readonly note: notation.Note,
  ) {
    super(box);
    this.addElement(
      Text.centered({
        box: new Box(0, 0, box.width, box.height),
        size: box.height,
        value: note.toString(),
      }),
    );
  }
}
