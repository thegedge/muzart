import * as layout from "../layout";
import { DEFAULT_SANS_SERIF_FONT_FAMILY } from "../layout";
import { RenderFunc } from "./types";

export const Text: RenderFunc<layout.Text> = (element, render, context) => {
  let x;
  let align: CanvasTextAlign;
  switch (context.style.textAlign) {
    case undefined:
    case "left":
      x = element.box.x;
      align = "left";
      break;
    case "center":
      x = element.box.centerX;
      align = "center";
      break;
    case "right":
      x = element.box.right;
      align = "right";
      break;
    default:
      throw new Error(`unsupported text-align value: ${context.style.textAlign}`);
  }

  let y;
  let baseline: CanvasTextBaseline;
  switch (context.style.verticalAlign) {
    case undefined:
    case "top":
      y = element.box.y;
      baseline = "top";
      break;
    case "middle": {
      y = element.box.centerY + 0.5 * element.size;
      baseline = "ideographic";
      break;
    }
    case "bottom":
      y = element.box.bottom;
      baseline = "ideographic";
      break;
    default:
      throw new Error(`unsupported vertical-align value: ${context.style.textAlign}`);
  }

  // TODO move these to score.css

  const background = context.style.backgroundColor;
  if (background) {
    render.fillStyle = background;
    render.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
  }

  const style = context.style.color;
  render.fillStyle = typeof style == "string" ? style : "#000000";
  render.textAlign = align;
  render.textBaseline = baseline;
  render.font = `
    ${context.style.fontStyle ?? ""}
    ${context.style.fontWeight ?? ""}
    ${element.size}px
    ${context.style.fontFamily ?? DEFAULT_SANS_SERIF_FONT_FAMILY}
  `;
  render.fillText(element.text, x, y);
};
