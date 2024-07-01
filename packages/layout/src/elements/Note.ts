import * as notation from "@muzart/notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils/Box";
import { Text } from "./Text";

export class Note extends SimpleGroup<"Note", Text> {
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
