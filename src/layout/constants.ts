import { Margins, Millimetres } from "./types";

export const INCH_TO_MM: Millimetres = 25.4;
export const DEFAULT_PAGE_WIDTH: Millimetres = 8.5 * INCH_TO_MM;
export const DEFAULT_PAGE_HEIGHT: Millimetres = 11 * INCH_TO_MM;
export const DEFAULT_MARGIN: Millimetres = 0.5 * INCH_TO_MM;
export const DEFAULT_MARGINS: Margins = {
  left: DEFAULT_MARGIN,
  right: DEFAULT_MARGIN,
  top: DEFAULT_MARGIN,
  bottom: DEFAULT_MARGIN,
};

/** The stroke width for any lines */
export const LINE_STROKE_WIDTH = 0.005 * INCH_TO_MM;

/** The height of a single line in a staff (for example, a string for a guitar tablature staff) */
export const STAFF_LINE_HEIGHT: Millimetres = 0.1 * INCH_TO_MM;

/** The space between lines */
export const LINE_MARGIN: Millimetres = 0.25 * INCH_TO_MM;

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
