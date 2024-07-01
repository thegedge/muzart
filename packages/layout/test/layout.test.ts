import { load } from "@muzart/loaders";
import { assert } from "@muzart/testing";
import { range } from "lodash";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, test } from "vitest";
import { layOutScore } from "../src";
import { Note } from "../src/elements/Note";
import { PageLine } from "../src/elements/pageline/PageLine";
import { adjacent } from "./elementHelpers";

describe("layout", () => {
  test("can lay out a tab", async () => {
    const fileData = await readFile(path.join(__dirname, "../../editor/public/songs/Song13.gp4"));
    const score = await load(new File([fileData], "Song13.gp4"));

    for (const partIndex of range(score.parts.length)) {
      const layout = layOutScore(score, [partIndex]);
      const part = layout.children[0];

      for (const [before, after] of adjacent(part.children)) {
        assert.nonOverlapping.isBefore(before, after, "vertical");
      }

      for (const page of part.children) {
        const lines: PageLine[] = page.content.children.filter((c) => c instanceof PageLine);
        for (const [before, after] of adjacent(lines)) {
          assert.nonOverlapping.isBefore(before, after, "vertical");
        }

        for (const line of lines) {
          for (const [before, after] of adjacent(line.measures)) {
            assert.nonOverlapping.isBefore(before, after, "horizontal");
          }

          for (const measure of line.measures) {
            for (const [before, after] of adjacent(measure.chords)) {
              assert.nonOverlapping.isBefore(before, after, "horizontal");
            }

            for (const chord of measure.chords) {
              if (chord.type == "Rest") {
                continue;
              }

              let notes: Note[] = chord.children.filter((c) => c instanceof Note);
              notes = notes
                .filter((n) => notes.every((n2) => n2.note.graceNote != n.note))
                .sort((a, b) => {
                  const stringA = a.note.placement?.string ?? 0;
                  const stringB = b.note.placement?.string ?? 0;
                  return stringA - stringB;
                });

              for (const [before, after] of adjacent(notes)) {
                assert.nonOverlapping.isBefore(before, after, "vertical");
              }
            }
          }
        }
      }
    }
  });
});
