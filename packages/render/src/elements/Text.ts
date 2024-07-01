import * as layout from "@muzart/layout";
import { DEFAULT_SANS_SERIF_FONT_FAMILY } from "@muzart/layout";
import { RenderFunc } from "../types";

export const Text: RenderFunc<layout.Text> = (element, render, context) => {
  let x: number;
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

  let startY: number;
  let baseline: CanvasTextBaseline;
  switch (context.style.verticalAlign) {
    case undefined:
    case "top":
      startY = element.box.y;
      baseline = "top";
      break;
    case "middle": {
      startY = element.box.centerY - 0.5 * element.size * (element.lines.length - 1) + 0.5 * element.size;
      baseline = "ideographic";
      break;
    }
    case "bottom":
      startY = element.box.bottom - element.size * (element.lines.length - 1);
      baseline = "ideographic";
      break;
    case "hanging":
      startY = element.box.y;
      baseline = "hanging";
      break;
    default:
      throw new Error(`unsupported vertical-align value: ${context.style.textAlign}`);
  }

  render.fillStyle = context.style.color || "currentColor";
  render.textAlign = align;
  render.textBaseline = baseline;
  render.font = `
    ${context.style.fontStyle ?? ""}
    ${context.style.fontWeight ?? ""}
    ${element.size}px
    ${context.style.fontFamily ?? DEFAULT_SANS_SERIF_FONT_FAMILY}
  `;

  element.lines.forEach((line, i) => {
    render.fillText(line, x, startY + i * element.size);
  });
};
