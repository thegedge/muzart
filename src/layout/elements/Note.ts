import types from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Note extends LayoutElement<"Note", types.Chord> implements types.Note {
  readonly type = "Note";

  constructor(
    box: Box,
    readonly note: notation.Note,
  ) {
    super(box);
  }
}
