import type * as CSS from "csstype";
import { SimpleGroup } from "../layouts/SimpleGroup";
import type { Millimetres } from "../types";
import { Box } from "../utils/Box";
import { Text } from "./Text";

export interface TextDecoration {
  upTick?: boolean;
  downTick?: boolean;
  dashed?: boolean;
}
export class DecoratedText extends SimpleGroup<"DecoratedText", Text> {
  readonly type = "DecoratedText";

  readonly textElement: Text;

  constructor(
    box: Box,
    readonly text: string,
    readonly size: Millimetres,
    readonly decorations: {
      start?: TextDecoration;
      end?: TextDecoration;
    } = {},
  ) {
    super(box);

    let textAlign: CSS.Properties["textAlign"];
    if (decorations.start && !decorations.end) {
      textAlign = "right";
    } else if (!decorations.start && decorations.end) {
      textAlign = "left";
    } else {
      textAlign = "center";
    }

    this.style.textAlign = textAlign;
    this.textElement = new Text({
      box: new Box(0, 0, box.width, box.height),
      size,
      value: text,
      style: {
        textAlign,
        verticalAlign: "middle",
      },
    });
    this.addElement(this.textElement);
  }

  layout(): void {
    this.textElement.box.width = this.box.width;
    this.textElement.box.height = this.box.height;
  }
}
