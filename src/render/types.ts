import * as CSS from "csstype";
import { Application } from "../editor/state/Application";
import layout, { Box } from "../layout";
import { StyleComputer } from "./StyleComputer";

export interface RenderContext {
  /** The application state */
  application: Application;

  /** The viewport used for rendering the root element */
  viewport: Box;

  /** Set of ancestors already rendered to get to the current element */
  ancestors: layout.AllElements[];

  /** The stylesheet  */
  styler: StyleComputer;

  /** The computed styles for the current element */
  style: CSS.Properties;
}

export type RenderFunc<E = layout.AllElements> = (
  element: E,
  render: CanvasRenderingContext2D,
  context: RenderContext,
) => void;
