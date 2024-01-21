import * as CSS from "csstype";
import { range } from "lodash";
import types, { DEFAULT_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";
import { Ellipse } from "./Ellipse";
import { Line } from "./Line";
import { Text } from "./Text";

export class ChordDiagram
  extends SimpleGroup<types.AnyLayoutElement, "ChordDiagram", types.LineElement>
  implements types.ChordDiagram
{
  readonly type = "ChordDiagram";

  constructor(readonly diagram: notation.ChordDiagram) {
    super(Box.empty()); // will figure this out after laid out

    const diagram_ = diagram.diagram;

    let verticalAlign: CSS.Properties["verticalAlign"];
    if (diagram_) {
      verticalAlign = "top";
    } else {
      verticalAlign = "bottom";
    }

    const width = 4 * STAFF_LINE_HEIGHT;
    const height = (diagram_ ? 7 : 1) * STAFF_LINE_HEIGHT;

    this.addElement(
      new Text({
        box: new Box(0, 0, width, STAFF_LINE_HEIGHT),
        value: diagram.name,
        size: STAFF_LINE_HEIGHT,
        style: {
          textAlign: "center",
          verticalAlign,
          fontFamily: DEFAULT_SERIF_FONT_FAMILY,
        },
      }),
    );

    if (diagram_) {
      const numFrets = 5; // TODO make this configurable
      const numStrings = 6; // TODO need to pull from instrument

      const textSize = 1.25 * STAFF_LINE_HEIGHT;
      const fretboardH = height - textSize - STAFF_LINE_HEIGHT;

      const fretY = 2 * STAFF_LINE_HEIGHT;
      const fretW = width / (numStrings - 1);
      const fretH = fretboardH / numFrets;

      if (diagram_.baseFret > 1) {
        this.addElement(
          Text.centered({
            value: diagram_.baseFret.toString(),
            box: new Box(-textSize + 2 * LINE_STROKE_WIDTH, fretY, fretH, fretH),
            size: fretH,
            style: {
              fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            },
          }),
        );
      }

      const openUnplayed = diagram_.frets.slice(0, numStrings);
      diagram_.barres.forEach((barre) => {
        openUnplayed.fill(1, barre.firstString, barre.lastString + 1);
      });

      openUnplayed.forEach((v, index) => {
        let value;
        let height = STAFF_LINE_HEIGHT;
        switch (v) {
          case undefined:
          case -1: {
            value = "×";
            break;
          }
          case 0: {
            height *= 0.94; // this character is set a little lower, so bring it up some to align nicely with the '×'
            value = "○";
            break;
          }
          default: {
            return;
          }
        }

        this.addElement(
          new Text({
            box: new Box((numStrings - index - 1.5) * fretW, STAFF_LINE_HEIGHT, fretW, height),
            size: textSize,
            value,
            style: {
              textAlign: "center",
              verticalAlign: "bottom",
              fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            },
          }),
        );
      });

      // The nut
      const line = Line.horizontal(-0.5 * LINE_STROKE_WIDTH, width + 0.5 * LINE_STROKE_WIDTH, fretY);
      line.style.strokeWidth = String(LINE_STROKE_WIDTH * (diagram_.baseFret == 1 ? 5 : 1));
      this.addElement(line);

      // Fret lines of the fretboard
      range(1, numFrets + 1).forEach((fret) => {
        this.addElement(Line.horizontal(0, width, fretY + fretH * fret));
      });

      // Vertical lines of the fretboard
      range(numStrings).forEach((string) => {
        this.addElement(Line.vertical(fretY, fretY + fretboardH, fretW * string));
      });

      diagram_.frets.forEach((fret, index) => {
        if (fret && fret > 0) {
          const cx = (numStrings - index - 1) * fretW;
          const cy = fretY + (fret - diagram_.baseFret + 0.5) * fretH;
          this.addElement(Ellipse.circle(cx, cy, 0.3 * fretW));
        }
      });

      diagram_.barres.forEach((barre) => {
        const startX = (numStrings - barre.firstString - 1) * fretW;
        const endX = (numStrings - barre.lastString - 1) * fretW;
        const y = fretY + (barre.baseFret - diagram_.baseFret + 0.5) * fretH;

        const barreLine = Line.horizontal(startX, endX, y);
        barreLine.style.strokeWidth = String(0.6 * fretW);

        this.addElement(Ellipse.circle(startX, y, 0.3 * fretW));
        this.addElement(Ellipse.circle(endX, y, 0.3 * fretW));
        this.addElement(barreLine);
      });
    }

    this.layout();
  }
}
