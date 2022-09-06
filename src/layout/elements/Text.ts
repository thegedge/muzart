import { CSSProperties } from "react";
import types, { Alignment, Millimetres } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

interface TextOptions {
  value: string;
  size: Millimetres;
  box?: Box;
  halign?: Alignment;
  valign?: Alignment;
  style?: CSSProperties;
}

export class Text extends LayoutElement<"Text", types.PageElement | types.LineElement> implements types.Text {
  static centered(options: TextOptions) {
    return new Text({ ...options, halign: "center", valign: "center" });
  }

  readonly type = "Text";
  readonly value: string;
  readonly size: number;
  readonly halign: Alignment;
  readonly valign: Alignment;
  readonly style: CSSProperties;

  constructor(options: TextOptions) {
    super(options.box ?? new Box(0, 0, options.size * options.value.length, options.size));
    this.value = options.value;
    this.size = options.size;
    this.halign = options.halign ?? "start";
    this.valign = options.valign ?? "start";
    this.style = options.style ?? {};
  }
}
