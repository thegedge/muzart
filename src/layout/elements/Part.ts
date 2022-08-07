import types from "..";
import * as notation from "../../notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";

export const PAGE_MARGIN = 0.5;

export class Part extends SimpleGroup<types.Page, "Part", types.Score> implements types.Part {
  readonly type = "Part";

  constructor(box: Box, readonly part: notation.Part) {
    super(box);
  }

  addElement(element: types.Page, stretch = true): void {
    element.layout?.(stretch);
    this.elements.push(element);
  }

  layout() {
    this.box = Box.encompass(...this.elements.map((e) => e.box))
      .expand(PAGE_MARGIN)
      .translate(2 * PAGE_MARGIN);
  }
}
