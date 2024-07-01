import * as notation from "@muzart/notation";
import type * as CSS from "csstype";
import { range } from "lodash";
import { DEFAULT_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils/Box";
import { Ellipse } from "./Ellipse";
import type { AnyLayoutElement } from "./LayoutElement";
import { Line } from "./Line";
import { Text } from "./Text";

export class ChordDiagram extends SimpleGroup<"ChordDiagram", AnyLayoutElement> {
  readonly type = "ChordDiagram";

  constructor(
    readonly diagram: notation.ChordDiagram,
    showDiagram = true,
  ) {
    super(Box.empty()); // will figure this out after laid out

    const diagram_ = showDiagram ? diagram.diagram : undefined;

    let verticalAlign: CSS.Properties["verticalAlign"];
    if (diagram_) {
      verticalAlign = "top";
    } else {
      verticalAlign = "bottom";
    }

    const width = 4 * STAFF_LINE_HEIGHT;
    const height = (diagram_ ? 7 : 1) * STAFF_LINE_HEIGHT;

    let y = 0;

    if (diagram.name) {
      this.addElement(
        new Text({
          box: new Box(0, 0, width, STAFF_LINE_HEIGHT),
          value: diagram.name,
          size: STAFF_LINE_HEIGHT,
          style: {
            // TODO always "center" once the chord diagrams are properly centered above chords
            textAlign: diagram_ ? "center" : "left",
            verticalAlign,
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        }),
      );

      y += STAFF_LINE_HEIGHT;
    }

    if (diagram_) {
      const numFrets = 5; // TODO make this configurable
      const numStrings = 6; // TODO need to pull from instrument

      const textSize = 1.25 * STAFF_LINE_HEIGHT;
      const fretboardH = height - textSize - STAFF_LINE_HEIGHT;

      const fretW = width / (numStrings - 1);
      const fretH = fretboardH / numFrets;

      if (diagram_.baseFret > 1) {
        this.addElement(
          Text.centered({
            value: diagram_.baseFret.toString(),
            box: new Box(-textSize + 2 * LINE_STROKE_WIDTH, y + STAFF_LINE_HEIGHT, fretH, fretH),
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
            box: new Box((numStrings - index - 1.5) * fretW, y, fretW, height),
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

      y += STAFF_LINE_HEIGHT;

      // The nut
      const line = Line.horizontal(-0.5 * LINE_STROKE_WIDTH, width + 0.5 * LINE_STROKE_WIDTH, y);
      line.style.strokeWidth = String(LINE_STROKE_WIDTH * (diagram_.baseFret == 1 ? 5 : 1));
      this.addElement(line);

      // Fret lines of the fretboard
      range(1, numFrets + 1).forEach((fret) => {
        this.addElement(Line.horizontal(0, width, y + fretH * fret));
      });

      // Vertical lines of the fretboard
      range(numStrings).forEach((string) => {
        this.addElement(Line.vertical(y, y + fretboardH, fretW * string));
      });

      diagram_.frets.forEach((fret, index) => {
        if (fret && fret > 0) {
          const cx = (numStrings - index - 1) * fretW;
          const cy = y + (fret - diagram_.baseFret + 0.5) * fretH;
          this.addElement(Ellipse.circle(cx, cy, 0.3 * fretW));
        }
      });

      diagram_.barres.forEach((barre) => {
        const startX = (numStrings - barre.firstString - 1) * fretW;
        const endX = (numStrings - barre.lastString - 1) * fretW;
        const barreY = y + (barre.baseFret - diagram_.baseFret + 0.5) * fretH;

        const barreLine = Line.horizontal(startX, endX, barreY);
        barreLine.style.strokeWidth = String(0.6 * fretW);

        this.addElement(Ellipse.circle(startX, y, 0.3 * fretW));
        this.addElement(Ellipse.circle(endX, y, 0.3 * fretW));
        this.addElement(barreLine);
      });
    }

    this.layout();
  }
}
