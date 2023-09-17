import layout, { Box } from "../layout";
import { Application } from "../ui/state/Application";

export interface RenderContext {
  /** The application state */
  application: Application;

  /** The viewport used for rendering the root element */
  viewport: Box;
}

export type RenderFunc<E = layout.AllElements> = (
  element: E,
  render: CanvasRenderingContext2D,
  context: RenderContext,
) => void;
