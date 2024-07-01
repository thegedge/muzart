import type * as CSS from "csstype";
import { Box } from "../utils/Box";

export type AnyLayoutElement = LayoutElement<string>;

export abstract class LayoutElement<TypeT extends string> {
  abstract readonly type: TypeT;

  parent: AnyLayoutElement | null = null;
  style: CSS.Properties = {};
  className?: string;
  children?: AnyLayoutElement[];

  constructor(public box = Box.empty()) {}

  layout(): void {
    // noop
  }
}
