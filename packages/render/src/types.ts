import type { Box } from "@muzart/layout";
import * as layout from "@muzart/layout";
import type * as CSS from "csstype";
import type { DebugContext } from "./DebugContext";
import { StyleComputer } from "./StyleComputer";

export interface RenderContext {
  /** An optional debug context to highlight a specific element and its ancestors  */
  debug?: DebugContext;

  /** The viewport used for rendering the root element */
  viewport: Box;

  /** Set of ancestors already rendered to get to the current element */
  ancestors: layout.AnyLayoutElement[];

  /** The stylesheet  */
  styler: StyleComputer;

  /** The computed styles for the current element */
  style: CSS.Properties;
}

export type RenderFunc<E = layout.AnyLayoutElement> = (
  element: E,
  render: CanvasRenderingContext2D,
  context: RenderContext,
) => void;
