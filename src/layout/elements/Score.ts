import types from "..";
import * as notation from "../../notation";
import { AbstractGroup } from "../layouts/AbstractGroup";
import { Box } from "../utils";

export const PAGE_MARGIN = 0.5;

export class Score extends AbstractGroup<types.Part, "Score", null> implements types.Score {
  readonly type = "Score";
  readonly elements: types.Part[] = [];

  constructor(readonly score: notation.Score) {
    super(Box.empty());
  }

  addElement(element: types.Part): void {
    this.elements.push(element);
  }

  layout() {
    for (const element of this.elements) {
      element.layout?.();
    }

    this.box = Box.encompass(...this.elements.map((e) => e.box)).update({ x: 0, y: 0 });
  }
}
