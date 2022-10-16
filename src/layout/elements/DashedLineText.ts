import types, { LINE_STROKE_WIDTH } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";
import { Text } from "./Text";

export class DashedLineText
  extends LayoutElement<"DashedLineText", types.DashedLineText>
  implements types.DashedLineText
{
  readonly type = "DashedLineText";

  constructor(readonly box: Box, readonly text: string, readonly size: number) {
    super(box);
  }

  render(context: CanvasRenderingContext2D): void {
    new Text({
      box: this.box,
      size: this.size,
      value: this.text,
      halign: "start",
      valign: "center",
      style: { color: "#333333" },
    }).render(context);

    // TODO need to have a better measurement of text instead of arbitrary multiplicative factor
    const textWidth = this.text.length * this.size * 0.6;

    if (textWidth < this.box.width) {
      context.strokeStyle = "#333333";

      context.beginPath();
      context.moveTo(this.box.x + Math.min(textWidth, this.box.width), this.box.centerY);
      context.lineTo(this.box.right, this.box.centerY);
      context.setLineDash([12 * LINE_STROKE_WIDTH, 4 * LINE_STROKE_WIDTH]);
      context.stroke();

      context.moveTo(this.box.right, this.box.centerY - 0.5 * this.size);
      context.lineTo(this.box.right, this.box.centerY + 0.5 * this.size);
      context.setLineDash([]);
      context.stroke();
      context.closePath();
    }
  }
}
