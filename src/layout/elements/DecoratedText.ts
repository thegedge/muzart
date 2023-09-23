import * as CSS from "csstype";
import types, { Millimetres, TextDecoration } from "..";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";
import { Text } from "./Text";

export class DecoratedText
  extends SimpleGroup<types.Text, "DecoratedText", types.LayoutElement>
  implements types.DecoratedText
{
  readonly type = "DecoratedText";

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

    this.style ??= {};
    this.style.textAlign = textAlign;

    this.addElement(
      new Text({
        box: new Box(0, 0, box.width, box.height),
        size: size,
        value: text,
        style: {
          textAlign,
        },
      }),
    );
  }
}
