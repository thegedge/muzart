import { JSXInternal } from "preact/src/jsx";
import { Alignment, Box, DEFAULT_SANS_SERIF_FONT_FAMILY } from "../layout";
import { RenderFunc } from "./types";

export const Text: RenderFunc<{
  text: string;
  size: number;
  box: Box;
  halign?: Alignment;
  valign?: Alignment;
  style?: JSXInternal.CSSProperties;
}> = (element, render) => {
  let x;
  let align: CanvasTextAlign;
  switch (element.halign) {
    case undefined:
    case "start":
      x = element.box.x;
      align = "start";
      break;
    case "center":
      x = element.box.centerX;
      align = "center";
      break;
    case "end":
      x = element.box.right;
      align = "end";
      break;
  }

  let y;
  let baseline: CanvasTextBaseline;
  switch (element.valign) {
    case undefined:
    case "start":
      y = element.box.y;
      baseline = "top";
      break;
    case "center": {
      y = element.box.centerY + 0.5 * element.size;
      baseline = "ideographic";
      break;
    }
    case "end":
      y = element.box.bottom;
      baseline = "ideographic";
      break;
  }

  // TODO move these to score.css

  const fill = element.style?.backgroundColor;
  if (fill) {
    render.fillStyle = typeof fill == "string" ? fill : "#ffffff";
    render.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
  }

  const style = element.style?.color ?? element.style?.fill;
  render.fillStyle = typeof style == "string" ? style : "#000000";
  render.textAlign = align;
  render.textBaseline = baseline;
  render.font = `
    ${element.style?.fontStyle ?? ""}
    ${element.style?.fontWeight ?? ""}
    ${element.size}px
    ${element.style?.fontFamily ?? DEFAULT_SANS_SERIF_FONT_FAMILY}
  `;
  render.fillText(element.text, x, y);
};
