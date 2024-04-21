import * as CSS from "csstype";
import * as types from "../types";
import { Box } from "../utils";

export abstract class LayoutElement<TypeT extends string, ParentT extends types.AnyLayoutElement | null>
  implements types.LayoutElement<ParentT>
{
  abstract readonly type: TypeT;
  parent: ParentT | null = null;

  style: CSS.Properties = {};
  className?: string;

  constructor(public box = Box.empty()) {}
}
