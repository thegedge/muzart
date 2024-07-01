import { DEFAULT_MARGINS, LINE_MARGIN } from "..";
import { FlexGroupElement } from "../layouts/FlexGroup";
import { Box } from "../utils/Box";
import { LayoutElement, type AnyLayoutElement } from "./LayoutElement";
import { Measure } from "./Measure";
import { PageLine } from "./pageline/PageLine";

export class Page extends LayoutElement<"Page"> {
  readonly type = "Page";
  readonly content: FlexGroupElement<AnyLayoutElement>;

  constructor(box: Box, margins = DEFAULT_MARGINS) {
    super(box);

    const contentWidth = box.width - margins.left - margins.right;
    const contentHeight = box.height - margins.top - margins.bottom;
    const pageContentBox = new Box(margins.left, margins.top, contentWidth, contentHeight);
    this.content = new FlexGroupElement({ box: pageContentBox, axis: "vertical", gap: LINE_MARGIN });
    this.content.parent = this;
    this.children = [this.content];
  }

  layout() {
    this.content.layout();
  }

  get lines(): PageLine[] {
    return this.content.children.filter((e) => e instanceof PageLine);
  }

  get measures(): Measure[] {
    return this.content.children.flatMap((e) => {
      return e instanceof PageLine ? e.measures : [];
    });
  }
}
