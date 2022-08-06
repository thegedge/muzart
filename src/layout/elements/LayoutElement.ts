import * as types from "../types";
import { Box } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class LayoutElement<TypeT extends string, ParentT extends types.LayoutElement<any> | null>
  implements types.LayoutElement<ParentT>
{
  abstract readonly type: TypeT;
  parent: ParentT | null = null;

  constructor(public box: Box) {}
}
