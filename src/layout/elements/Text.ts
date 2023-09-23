import * as CSS from "csstype";
import types, { Millimetres } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export type StringProperties<T> = { [K in keyof T]: T[K] extends string | null | undefined ? K : never }[keyof T];

type TextOptions = {
  value: string;
  size: Millimetres;
  box?: Box;
  style?: CSS.Properties;
  setText?: (value: string) => void;
};

export class Text extends LayoutElement<"Text", types.PageElement | types.LineElement> implements types.Text {
  static centered(options: TextOptions): Text {
    return new Text({
      ...options,
      style: {
        ...options?.style,
        textAlign: "center",
        verticalAlign: "middle",
      },
    });
  }

  static boundText<Target, Property extends StringProperties<Target>>(
    target: Target,
    prop: Property,
    options: Omit<TextOptions, "value">,
  ): Text {
    return new Text({
      ...options,
      value: (target[prop] as string | null | undefined) ?? "", // TODO why are these casts necessary?
      setText: (value: string) => {
        target[prop] = value as Target[Property];
      },
    });
  }

  readonly type = "Text";
  readonly size: number;

  private value: string;
  private setText: ((value: string) => void) | undefined;

  constructor(readonly options: TextOptions) {
    super(options.box ?? new Box(0, 0, options.size * options.value.length, options.size));

    this.size = options.size;
    this.value = options.value;
    this.setText = options.setText;
    this.style = options.style ?? {};
  }

  get isReadOnly(): boolean {
    return !this.setText;
  }

  get text(): string {
    return this.value;
  }

  set text(value: string) {
    if (this.isReadOnly) {
      throw new Error("can't set text on a readonly text element");
    }

    this.value = value;
    this.setText?.(value);
  }
}
