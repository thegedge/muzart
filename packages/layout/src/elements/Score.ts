import * as notation from "@muzart/notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils/Box";
import type { Part } from "./Part";

export class Score extends SimpleGroup<"Score", Part> {
  readonly type = "Score";
  parent = null;

  constructor(readonly score: notation.Score) {
    super();
  }

  layout() {
    super.layout();
    this.box = Box.encompass(...this.children.map((e) => e.box));
  }
}
