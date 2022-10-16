import { CSSProperties } from "react";
import types, { Alignment, DEFAULT_SANS_SERIF_FONT_FAMILY, Millimetres } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

interface TextOptions {
  value: string;
  size: Millimetres;
  box?: Box;
  halign?: Alignment;
  valign?: Alignment;
  style?: CSSProperties;
  fill?: string;
}

export class Text extends LayoutElement<"Text", types.PageElement | types.LineElement> implements types.Text {
  static centered(options: TextOptions) {
    return new Text({ ...options, halign: "center", valign: "center" });
  }

  readonly type = "Text";
  readonly text: string;
  readonly size: number;
  readonly fill: string | null;
  readonly halign: Alignment;
  readonly valign: Alignment;
  readonly style: CSSProperties;

  constructor(options: TextOptions) {
    super(options.box ?? new Box(0, 0, options.size * options.value.length, options.size));
    this.text = options.value;
    this.size = options.size;
    this.halign = options.halign ?? "start";
    this.valign = options.valign ?? "start";
    this.style = options.style ?? {};
    this.fill = options.fill ?? null;
  }

  render(context: CanvasRenderingContext2D): void {
    let x;
    let align: CanvasTextAlign;
    switch (this.halign) {
      case undefined:
      case "start":
        x = this.box.x;
        align = "start";
        break;
      case "center":
        x = this.box.centerX;
        align = "center";
        break;
      case "end":
        x = this.box.right;
        align = "end";
        break;
    }

    let y;
    let baseline: CanvasTextBaseline;
    switch (this.valign) {
      case undefined:
      case "start":
        y = this.box.y;
        baseline = "top";
        break;
      case "center": {
        y = this.box.centerY + 0.5 * this.size;
        baseline = "ideographic";
        break;
      }
      case "end":
        y = this.box.bottom;
        baseline = "ideographic";
        break;
    }

    if (this.fill) {
      context.fillStyle = this.fill;
      context.fillRect(this.box.x, this.box.y, this.box.width, this.box.height);
    }

    const style = this.style?.color ?? this.style?.fill;
    context.fillStyle = typeof style == "string" ? style : "#000000";
    context.textAlign = align;
    context.textBaseline = baseline;
    context.font = `
      ${this.style?.fontStyle ?? ""}
      ${this.style?.fontWeight ?? ""}
      ${this.size}px
      ${this.style?.fontFamily ?? DEFAULT_SANS_SERIF_FONT_FAMILY}
    `;
    context.fillText(this.text, x, y);
  }
}
