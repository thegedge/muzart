import { Margins, Millimetres } from "./types";

export const PX_PER_MM = 4; // assuming 96 pixels per inch, rounded up (from 3.7795275591) so we have integers

export const DEFAULT_PAGE_WIDTH: Millimetres = 210;
export const DEFAULT_PAGE_HEIGHT: Millimetres = 297;
export const DEFAULT_MARGIN: Millimetres = 12;
export const DEFAULT_MARGINS: Margins = {
  left: DEFAULT_MARGIN,
  right: DEFAULT_MARGIN,
  top: DEFAULT_MARGIN,
  bottom: DEFAULT_MARGIN,
};

/** The stroke width for any lines */
export const LINE_STROKE_WIDTH = 0.1;

/** The height of a single line in a staff (for example, a string for a guitar tablature staff) */
export const STAFF_LINE_HEIGHT: Millimetres = 2.5;

/** The space between lines */
export const LINE_MARGIN: Millimetres = 6;

export const STEM_HEIGHT = STAFF_LINE_HEIGHT * 3;
export const BEAM_HEIGHT = STAFF_LINE_HEIGHT / 4;
export const TUPLET_SIZE = 2.5 * BEAM_HEIGHT;

// TODO less arbitrary, measure text
export const chordWidth = (numChars: number) => STAFF_LINE_HEIGHT * (0.5 + 0.3 * numChars);

// For now, some default fonts to ensure things look the way I see them for everyone else
export const DEFAULT_SANS_SERIF_FONT_FAMILY =
  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif";
export const DEFAULT_SERIF_FONT_FAMILY = "Times New Roman, serif";

export const STEM_BEAM_COLOR = "#333333";
