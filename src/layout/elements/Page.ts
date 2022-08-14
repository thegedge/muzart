import types, { DEFAULT_MARGINS, LINE_MARGIN } from "..";
import { FlexGroupElement } from "../layouts/FlexGroup";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Page extends LayoutElement<"Page", types.Part> implements types.Page {
  readonly type = "Page";
  readonly content: FlexGroupElement<types.PageElement>;

  constructor(box: Box) {
    super(box);

    const margins = DEFAULT_MARGINS;
    const contentWidth = box.width - margins.left - margins.right;
    const contentHeight = box.height - margins.top - margins.bottom;
    const pageContentBox = new Box(margins.left, margins.top, contentWidth, contentHeight);
    this.content = new FlexGroupElement({ box: pageContentBox.clone(), axis: "vertical", gap: LINE_MARGIN });
    this.content.parent = this;
  }

  layout() {
    this.content.layout();
  }

  get measures(): types.Measure[] {
    return this.content.children.flatMap((e) => {
      if (e.type != "PageLine") {
        return [];
      }

      return e.measures;
    });
  }
}
