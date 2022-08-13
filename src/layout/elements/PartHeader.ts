import { compact, last, uniqBy } from "lodash";
import types, { Box, DEFAULT_MARGIN, LineElement, LINE_MARGIN, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { FlexGroup, FlexGroupElement } from "../layouts/FlexGroup";
import { SimpleGroupElement } from "../layouts/SimpleGroup";
import { ChordDiagram } from "./ChordDiagram";
import { Space } from "./Space";
import { Text } from "./Text";

export class PartHeader extends FlexGroup<types.PageElement, "Group", types.Part> implements types.LayoutElement {
  readonly type = "Group";

  /** If true, show chord diagrams for all chords used in the tab  */
  readonly summarizeChords = true;

  constructor(readonly score: notation.Score, readonly part: notation.Part, readonly contentWidth: number) {
    super({
      box: new Box(0, 0, contentWidth, 0),
      axis: "vertical",
      defaultFlexProps: { factor: null },
    });

    // Lay out the composition title, composer, etc
    if (score.title) {
      const height = 4 * STAFF_LINE_HEIGHT;
      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, height),
          halign: "center",
          size: height,
          value: score.title,
          style: {
            fontFamily: "serif",
          },
        })
      );
    }

    if (score.composer) {
      const height = 1.5 * STAFF_LINE_HEIGHT;

      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 2 * height),
          halign: "end",
          size: height,
          value: score.composer,
          style: {
            fontFamily: "serif",
          },
        })
      );
    }

    if (score.comments) {
      const height = STAFF_LINE_HEIGHT;
      for (const comment of score.comments) {
        this.addElement(
          new Text({
            box: new Box(0, 0, contentWidth, 1.5 * height),
            halign: "center",
            valign: "start",
            size: height,
            value: comment,
            style: {
              fontFamily: "serif",
              fontStyle: "italic",
            },
          })
        );
      }
    }

    this.maybeAddChordDiagrams();

    if (part.instrument?.tuning) {
      // TODO show alternative name for tuning
      const textSize = STAFF_LINE_HEIGHT;
      const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
      const texts: Text[] = part.instrument.tuning.map(
        (pitch, index) =>
          new Text({
            box: new Box(0, 0, textSize * 5, textSize),
            size: textSize,
            value: `${stringNumbers[index]} = ${pitch}`,
            style: {
              fontFamily: "serif",
            },
          })
      );

      const offset = Math.round(texts.length / 2);
      for (let index = 0; index < offset; ++index) {
        const group = new SimpleGroupElement<LineElement>(new Box(0, 0, textSize * 10, 1.3 * textSize));
        group.addElement(texts[index]);

        if (offset + index < texts.length) {
          const text = texts[offset + index];
          text.box.x = textSize * 5;
          group.addElement(text);
        }

        this.addElement(group);
      }
    }
  }

  maybeAddChordDiagrams() {
    if (!this.summarizeChords) {
      return;
    }

    // Get all unique chord diagrams
    const allDiagrams = this.part.measures.flatMap((measure) => {
      return compact(measure.chords.map((chord) => (chord.chordDiagram?.diagram ? chord.chordDiagram : null)));
    });

    const uniqueDiagrams = uniqBy(allDiagrams, (diagram) => JSON.stringify(diagram));
    if (uniqueDiagrams.length == 0) {
      return;
    }

    const group = new FlexGroupElement<ChordDiagram>({
      axis: "horizontal",
      box: new Box(0, 0, this.contentWidth, 1),
      gap: 0.5 * DEFAULT_MARGIN,
      defaultFlexProps: { factor: null },
      mainAxisSpaceDistribution: "center",
      wrap: true,
    });

    for (const diagram of uniqueDiagrams) {
      group.addElement(new ChordDiagram(diagram));
    }

    this.addElement(Space.fromDimensions(1, 0.5 * LINE_MARGIN));
    this.addElement(group);
  }

  layout() {
    super.layout();
    this.box.height = last(this.children)?.box.bottom ?? 0;
  }
}
