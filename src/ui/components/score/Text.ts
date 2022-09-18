import { CSSProperties } from "react";
import { Alignment, DEFAULT_SANS_SERIF_FONT_FAMILY } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { Application } from "../../state/Application";

export const Text = (
  _application: Application,
  context: CanvasRenderingContext2D,
  props: {
    text: string;
    size: number;
    box: Box;
    halign?: Alignment;
    valign?: Alignment;
    fill?: boolean | string;
    style?: CSSProperties;
  }
) => {
  let x;
  let align: CanvasTextAlign;
  switch (props.halign) {
    case undefined:
    case "start":
      x = props.box.x;
      align = "start";
      break;
    case "center":
      x = props.box.centerX;
      align = "center";
      break;
    case "end":
      x = props.box.right;
      align = "end";
      break;
  }

  let y;
  let baseline: CanvasTextBaseline;
  switch (props.valign) {
    case undefined:
    case "start":
      y = props.box.y;
      baseline = "hanging";
      break;
    case "center": {
      y = props.box.centerY + 0.5 * props.size;
      baseline = "ideographic";
      break;
    }
    case "end":
      y = props.box.bottom;
      baseline = "ideographic";
      break;
  }

  if (props.fill) {
    context.fillStyle = props.fill === true ? "#ffffff" : props.fill;
    context.fillRect(props.box.x, props.box.y, props.box.width, props.box.height);
  }

  const style = props.style?.color ?? props.style?.fill;
  context.fillStyle = typeof style == "string" ? style : "#000000";
  context.textAlign = align;
  context.textBaseline = baseline;
  context.font = `
    ${props.style?.fontStyle ?? ""}
    ${props.style?.fontWeight ?? ""}
    ${props.size}px
    ${props.style?.fontFamily ?? DEFAULT_SANS_SERIF_FONT_FAMILY}
  `;
  context.fillText(props.text, x, y);
};
