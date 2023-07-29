import types from "..";
import * as notation from "../../notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";

export const PAGE_MARGIN = 12;

export class Part extends SimpleGroup<types.Page, "Part", types.Score> implements types.Part {
  readonly type = "Part";

  constructor(
    box: Box,
    readonly part: notation.Part,
  ) {
    super(box);
  }

  layout() {
    this.children.reduce((y, element) => {
      element.layout?.();
      element.box.x = PAGE_MARGIN;
      element.box.y = y;
      return y + element.box.height + PAGE_MARGIN;
    }, PAGE_MARGIN);

    this.box = Box.encompass(...this.children.map((e) => e.box));
    this.box.x = 0;
    this.box.y = 0;
    this.box.width += PAGE_MARGIN;
    this.box.height += PAGE_MARGIN;
  }
}
