import * as notation from "@muzart/notation";
import { compact, uniqBy } from "lodash-es";
import { DEFAULT_MARGIN, DEFAULT_SERIF_FONT_FAMILY, STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup, FlexGroupElement } from "../layouts/FlexGroup";
import { SimpleGroupElement } from "../layouts/SimpleGroup";
import type { LayoutContext } from "../types";
import { Box } from "../utils/Box";
import { ChordDiagram } from "./ChordDiagram";
import type { AnyLayoutElement } from "./LayoutElement";
import { Space } from "./Space";
import { Text } from "./Text";

export class PartHeader extends FlexGroup<"Group", AnyLayoutElement> {
  readonly type = "Group";

  /** If true, show chord diagrams for all chords used in the tab  */
  readonly summarizeChords = true;

  constructor(
    readonly score: notation.Score,
    readonly part: notation.Part,
    readonly contentWidth: number,
    readonly context: LayoutContext,
  ) {
    const heightFactor = context.layoutMode === "compact" ? 0.8 * STAFF_LINE_HEIGHT : STAFF_LINE_HEIGHT;

    super({
      box: new Box(0, 0, contentWidth, 0),
      axis: "vertical",
      defaultStretchFactor: 0,
      gap: 0.5 * heightFactor,
    });

    // Lay out the composition title, composer, etc
    if (score.title) {
      const height = 4 * heightFactor;
      this.addElement(
        Text.boundText(score, "title", {
          box: new Box(0, 0, contentWidth, 1.5 * height),
          size: height,
          style: {
            textAlign: "center",
            verticalAlign: "middle",
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        }),
      );
    }

    if (score.artist) {
      const height = 2 * heightFactor;
      this.addElement(
        Text.boundText(score, "artist", {
          box: new Box(0, 0, contentWidth, 1.5 * height),
          size: height,
          style: {
            textAlign: "center",
            verticalAlign: "middle",
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            fontWeight: "bold",
          },
        }),
      );
    }

    if (score.album) {
      const height = 1.5 * heightFactor;
      this.addElement(
        Text.boundText(score, "album", {
          box: new Box(0, 0, contentWidth, 2 * height),
          size: height,
          style: {
            textAlign: "center",
            verticalAlign: "middle",
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        }),
      );
    }

    if (score.comments) {
      const height = 1.2 * heightFactor;
      const numLines = score.comments.split("\n").length; // TODO faster count
      this.addElement(
        Text.boundText(score, "comments", {
          box: new Box(0, 0, contentWidth, height * numLines),
          size: height,
          style: {
            textAlign: "center",
            verticalAlign: "middle",
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            fontStyle: "italic",
          },
        }),
      );
    }

    if (score.composer) {
      const height = 1.25 * heightFactor;

      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.4 * height),
          size: height,
          // TODO can't do bound text when we format the display this way
          value: score.composer.includes(" by ") ? score.composer : `Composed by ${score.composer}`,
          style: {
            textAlign: "right",
            verticalAlign: "middle",
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        }),
      );
    }

    // Don't show the transcriber if the same as the composer (assume they're one and the same)
    if (score.transcriber && score.transcriber != score.composer) {
      const height = 1.25 * heightFactor;

      this.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.4 * height),
          size: height,
          // TODO can't do bound text when we format the display this way
          value: score.transcriber.includes(" by ") ? score.transcriber : `Transcribed by ${score.transcriber}`,
          style: {
            textAlign: "right",
            verticalAlign: "middle",
            fontFamily: DEFAULT_SERIF_FONT_FAMILY,
          },
        }),
      );
    }

    this.addElement(Space.fromDimensions(contentWidth, heightFactor));
    this.maybeAddChordDiagrams();

    if (part.instrument instanceof notation.StringInstrument) {
      const tuningsGroup = new FlexGroupElement<SimpleGroupElement<Text>>({
        box: new Box(0, 0, contentWidth, 0),
        axis: "vertical",
        crossAxisAlignment: "start",
        gap: 0,
        defaultStretchFactor: 0,
      });

      // TODO show alternative name for tuning
      const textSize = heightFactor;
      const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
      const texts: Text[] = part.instrument.tuning.map(
        (pitch, index) =>
          new Text({
            box: new Box(0, 0, textSize * 5, textSize * 1.3),
            size: textSize,
            value: `${stringNumbers[index]} = ${pitch}`,
            style: {
              verticalAlign: "middle",
              fontFamily: DEFAULT_SERIF_FONT_FAMILY,
            },
          }),
      );

      const offset = Math.round(texts.length / 2);
      for (let index = 0; index < offset; ++index) {
        const rowGroup = new SimpleGroupElement<Text>();
        rowGroup.addElement(texts[index]);

        if (offset + index < texts.length) {
          const text = texts[offset + index];
          text.box.x = textSize * 5;
          rowGroup.addElement(text);
        }

        // TODO refactor layout system so things can grow
        tuningsGroup.box.height += texts[index].box.height;

        tuningsGroup.addElement(rowGroup);
      }

      tuningsGroup.layout();
      this.addElement(tuningsGroup);
    }
  }

  maybeAddChordDiagrams() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- okay with this, but one day will be configurable
    if (!this.summarizeChords) {
      return;
    }

    // TODO this is slow-ish to call in a tight loop, even when no chord diagrams, because there can be a lot of measures.
    //   Not a big deal right now, but may want to optimize later (store at the score/part level on load, have chords reference them, etc.)

    // Get all unique chord diagrams
    const allDiagrams = this.part.measures.flatMap((measure) => {
      return compact(measure.chords.map((chord) => (chord.chordDiagram?.diagram ? chord.chordDiagram : null)));
    });

    if (allDiagrams.length == 0) {
      return;
    }

    const uniqueDiagrams = uniqBy(allDiagrams, (diagram) => JSON.stringify(diagram));
    const group = new FlexGroupElement<ChordDiagram>({
      box: new Box(0, 0, this.contentWidth, 1),
      gap: 0.5 * DEFAULT_MARGIN,
      defaultStretchFactor: 0,
      axis: "horizontal",
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
    this.box.height = this.children.reduce((h, c) => h + c.box.height, 0) + (this.children.length - 1) * this.gap;
    super.layout();
  }
}
