import { compact, uniqBy } from "lodash";
import types, { Box, DEFAULT_MARGIN, DEFAULT_SERIF_FONT_FAMILY, LineElement, STAFF_LINE_HEIGHT } from "..";
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
      defaultStretchFactor: 0,
      // TODO maybe try to make this work nicely with a gap
    });

    // Lay out the composition title, composer, etc
    if (score.title) {
      const height = 4 * STAFF_LINE_HEIGHT;
      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, height),
          halign: "center",
          valign: "start",
          size: height,
          value: score.title,
          style: {
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        })
      );
    }

    if (score.artist) {
      const height = 1.5 * STAFF_LINE_HEIGHT;
      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.2 * height),
          halign: "center",
          valign: "center",
          size: height,
          value: score.artist,
          style: {
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            fontWeight: "bold",
          },
        })
      );
    }

    if (score.album) {
      const height = 1.5 * STAFF_LINE_HEIGHT;
      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.2 * height),
          halign: "center",
          valign: "center",
          size: height,
          value: score.album,
          style: {
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
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
            valign: "center",
            size: height,
            value: comment,
            style: {
              fontFamily: DEFAULT_SERIF_FONT_FAMILY,
              fontStyle: "italic",
            },
          })
        );
      }
    }

    // Sometimes these can be quite long, so put some spacing between them
    if (score.composer || score.transcriber) {
      this.addElement(Space.fromDimensions(contentWidth, STAFF_LINE_HEIGHT));
    }

    if (score.composer) {
      const height = 1.25 * STAFF_LINE_HEIGHT;

      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.4 * height),
          halign: "end",
          valign: "center",
          size: height,
          value: score.composer.includes(" by ") ? score.composer : `Composed by ${score.composer}`,
          style: {
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        })
      );
    }

    // Don't show the transcriber if the same as the composer (assume they're one and the same)
    if (score.transcriber && score.transcriber != score.composer) {
      const height = 1.25 * STAFF_LINE_HEIGHT;

      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.4 * height),
          halign: "end",
          valign: "center",
          size: height,
          value: score.transcriber.includes(" by ") ? score.transcriber : `Transcribed by ${score.transcriber}`,
          style: {
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        })
      );
    }

    this.addElement(Space.fromDimensions(contentWidth, 2 * STAFF_LINE_HEIGHT));
    this.maybeAddChordDiagrams();

    if (part.instrument?.tuning) {
      // TODO show alternative name for tuning
      const textSize = STAFF_LINE_HEIGHT;
      const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
      const texts: Text[] = part.instrument.tuning.map(
        (pitch, index) =>
          new Text({
            box: new Box(0, 0, textSize * 5, textSize * 1.3),
            size: textSize,
            value: `${stringNumbers[index]} = ${pitch}`,
            valign: "center",
            style: {
              fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            },
          })
      );

      const offset = Math.round(texts.length / 2);
      for (let index = 0; index < offset; ++index) {
        const group = new SimpleGroupElement<LineElement>();
        group.addElement(texts[index]);

        if (offset + index < texts.length) {
          const text = texts[offset + index];
          text.box.x = textSize * 5;
          group.addElement(text);
        }

        group.layout();

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
      defaultStretchFactor: 0,
      mainAxisSpaceDistribution: "center",
      wrap: true,
    });

    for (const diagram of uniqueDiagrams) {
      group.addElement(new ChordDiagram(diagram));
    }
    group.layout();

    this.addElement(group);
  }

  layout() {
    this.box.height = this.children.reduce((h, c) => h + c.box.height, 0);
    super.layout();
  }
}
