import layout, { Box } from "../layout";
import { Application } from "../ui/state/Application";
import { StyleComputer } from "../utils/StyleComputer";

export interface RenderContext {
  /** The application state */
  application: Application;

  /** The viewport used for rendering the root element */
  viewport: Box;

  /** Set of ancestors already rendered to get to the current element */
  ancestors: layout.AllElements[];

  /** The stylesheet  */
  styling: StyleComputer;
}

export type RenderFunc<E = layout.AllElements> = (
  element: E,
  render: CanvasRenderingContext2D,
  context: RenderContext,
) => void;
