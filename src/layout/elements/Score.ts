import types from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export const PAGE_MARGIN = 0.5;

export class Score extends LayoutElement<"Score", null> implements types.Score {
  readonly type = "Score";
  readonly elements: types.Part[] = [];

  constructor(readonly score: notation.Score) {
    super(Box.empty());
  }

  addElement(element: types.Part): void {
    element.layout?.();
    this.elements.push(element);
  }

  layout() {
    this.box = Box.encompass(...this.elements.map((e) => e.box)).update({ x: 0, y: 0 });
  }
}
