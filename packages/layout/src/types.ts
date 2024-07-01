/**
 * The base measurement type.
 */
export type Millimetres = number;

/**
 * How a layout element aligns its children.
 */
export type Alignment = "start" | "center" | "end";

/**
 * Context propagated throughout the layout process.
 */
export type LayoutContext = {
  /**
   * Mode to use by layout algorithms
   *
   * `normal` is the default layout style, rendering the score as pages with gap.
   * `compact` tries to minimize the margins and paddings, which is good for small screens.
   */
  layoutMode: "compact" | "normal";
};

/**
 * The margins around a layout element.
 */
export interface Margins {
  left: Millimetres;
  right: Millimetres;
  top: Millimetres;
  bottom: Millimetres;
}
