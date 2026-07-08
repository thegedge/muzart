import * as notation from "@muzart/notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils/Box";
import type { Part } from "./Part";

export class Score extends SimpleGroup<"Score", Part> {
  readonly type = "Score";
  parent = null;
  readonly score: notation.Score;

  constructor(score: notation.Score) {
    super();
    this.score = score;
  }

  layout() {
    super.layout();
    this.box = Box.encompass(...this.children.map((e) => e.box));
  }
}
