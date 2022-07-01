import { Inches, Margins } from "./types";

export const DEFAULT_PAGE_WIDTH: Inches = 8.5;
export const DEFAULT_PAGE_HEIGHT: Inches = 11;
export const DEFAULT_MARGIN: Inches = 0.5;
export const DEFAULT_MARGINS: Margins = {
  left: DEFAULT_MARGIN,
  right: DEFAULT_MARGIN,
  top: DEFAULT_MARGIN,
  bottom: DEFAULT_MARGIN,
};

/** The stroke width for any lines */
export const LINE_STROKE_WIDTH = 0.005;

/** The height of a single line in a staff (for example, a string for a guitar tablature staff) */
export const STAFF_LINE_HEIGHT: Inches = 0.1;

/** The space between lines */
export const LINE_MARGIN: Inches = 0.25;

export const STEM_HEIGHT = STAFF_LINE_HEIGHT * 3;
export const BEAM_HEIGHT = STAFF_LINE_HEIGHT / 4;
export const DOT_SIZE = 2 * BEAM_HEIGHT;
export const TUPLET_SIZE = 2.5 * BEAM_HEIGHT;
