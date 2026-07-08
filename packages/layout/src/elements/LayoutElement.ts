import type * as CSS from "csstype";
import { Box } from "../utils/Box";

export type AnyLayoutElement = LayoutElement<string>;

export abstract class LayoutElement<TypeT extends string> {
  abstract readonly type: TypeT;

  parent: AnyLayoutElement | null = null;
  style: CSS.Properties = {};
  className?: string;
  children?: AnyLayoutElement[];
  box: Box;

  constructor(box = Box.empty()) {
    this.box = box;
  }

  layout(): void {
    // noop
  }
}
