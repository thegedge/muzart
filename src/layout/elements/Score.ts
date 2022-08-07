import types from "..";
import * as notation from "../../notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";

export class Score extends SimpleGroup<types.Part, "Score", null> implements types.Score {
  readonly type = "Score";

  constructor(readonly score: notation.Score) {
    super();
  }

  layout() {
    super.layout();
    this.box = Box.encompass(...this.children.map((e) => e.box));
  }
}
