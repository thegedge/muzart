import types, { chordWidth, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Rests } from "../../ui/resources/rests";
import { ancestorOfType, Box } from "../utils";
import { LayoutElement } from "./LayoutElement";
import { Part } from "./Part";

const REST_COLOR = "#333333";

export class Rest extends LayoutElement<"Rest", types.LineElement> implements types.Rest {
  readonly type = "Rest";

  constructor(readonly chord: notation.Chord, staffLineCount: number) {
    super(new Box(0, 0, chordWidth(4), staffLineCount * STAFF_LINE_HEIGHT));
  }

  render(context: CanvasRenderingContext2D): void {
    const path = Rests[this.chord.value.name];
    if (!path) {
      return;
    }

    // TODO with a properly sized box, we should be able to place these without needing the instrument
    const part = ancestorOfType<this, Part>(this, "Part");
    const offset = ((part?.part?.instrument?.tuning?.length ?? 6) - 1) / 2;

    context.save();
    context.translate(this.box.x, this.box.y + STAFF_LINE_HEIGHT * offset);
    context.scale(STAFF_LINE_HEIGHT, STAFF_LINE_HEIGHT);
    context.fillStyle = REST_COLOR;
    context.fill(new Path2D(path));
    context.restore();
  }
}
