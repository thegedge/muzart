import { last } from "lodash";
import types, { Box, LineElement, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { FlexGroup } from "../layouts/FlexGroup";
import { SimpleGroupElement } from "../layouts/SimpleGroup";
import { Text } from "./Text";

export class PartHeader extends FlexGroup<types.PageElement, "Group", types.Part> implements types.LayoutElement {
  readonly type = "Group";

  constructor(score: notation.Score, part: notation.Part, contentWidth: number) {
    super({
      box: new Box(0, 0, contentWidth, 0),
      axis: "vertical",
      defaultFlexProps: { factor: null },
    });

    // Lay out the composition title, composer, etc
    if (score.title) {
      const height = 4 * STAFF_LINE_HEIGHT;
      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, height),
          halign: "middle",
          size: height,
          value: score.title,
          style: {
            fontFamily: "serif",
          },
        })
      );
    }

    if (score.composer) {
      const height = 1.5 * STAFF_LINE_HEIGHT;

      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 2 * height),
          halign: "end",
          size: height,
          value: score.composer,
          style: {
            fontFamily: "serif",
          },
        })
      );
    }

    if (score.comments) {
      const height = STAFF_LINE_HEIGHT;
      for (const comment of score.comments) {
        this.addElement(
          new Text({
            box: new Box(0, 0, contentWidth, 1.5 * height),
            halign: "middle",
            size: height,
            value: comment,
            style: {
              fontFamily: "serif",
              fontStyle: "italic",
            },
          })
        );
      }
    }

    if (part.instrument && part.instrument.tuning) {
      // TODO show alternative name for tuning
      const textSize = STAFF_LINE_HEIGHT;
      const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
      const texts: Text[] = part.instrument.tuning.map(
        (pitch, index) =>
          new Text({
            box: new Box(0, 0, textSize * 5, textSize),
            size: textSize,
            value: `${stringNumbers[index]} = ${pitch}`,
            style: {
              fontFamily: "serif",
            },
          })
      );

      const offset = Math.round(texts.length / 2);
      for (let index = 0; index < offset; ++index) {
        const group = new SimpleGroupElement<LineElement>(new Box(0, 0, textSize * 10, 1.3 * textSize));
        group.addElement(texts[index]);

        if (offset + index < texts.length) {
          const text = texts[offset + index];
          text.box.x = textSize * 5;
          group.addElement(text);
        }

        this.addElement(group);
      }
    }
  }

  layout() {
    super.layout();
    this.box.height = last(this.children)?.box.bottom ?? 0;
  }
}
