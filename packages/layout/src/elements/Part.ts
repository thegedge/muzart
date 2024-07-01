import * as notation from "@muzart/notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import type { LayoutContext } from "../types";
import { Box } from "../utils/Box";
import type { Measure } from "./Measure";
import type { Page } from "./Page";

const PAGE_MARGIN = 12;

export class Part extends SimpleGroup<"Part", Page> {
  readonly type = "Part";
  readonly measures: Measure[] = [];

  constructor(
    box: Box,
    readonly part: notation.Part,
    readonly context: LayoutContext,
  ) {
    super(box);
  }

  layout() {
    if (this.context.layoutMode === "compact") {
      this.children.reduce((y, element) => {
        element.layout();
        element.box.x = 0;
        element.box.y = y;
        return y + element.box.height;
      }, 0);

      this.box = Box.encompass(...this.children.map((e) => e.box));
    } else {
      this.children.reduce((y, element) => {
        element.layout();
        element.box.x = PAGE_MARGIN;
        element.box.y = y;
        return y + element.box.height + PAGE_MARGIN;
      }, PAGE_MARGIN);

      this.box = Box.encompass(...this.children.map((e) => e.box));
      this.box.x = 0;
      this.box.y = 0;
      this.box.width += 2 * PAGE_MARGIN;
      this.box.height += 2 * PAGE_MARGIN;
    }
  }
}
