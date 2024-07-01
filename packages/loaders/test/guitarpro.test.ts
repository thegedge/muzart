import { assert, describe, test } from "@muzart/testing";
import { readFile } from "node:fs/promises";
import path from "node:path";
import load from "../src/guitarpro";

describe("guitarpro", () => {
  test("can load an example file", async () => {
    const fileData = await readFile(path.join(__dirname, "../../editor/public/songs/Song13.gp4"));
    const score = load(fileData.buffer).load();

    assert.matches(score, {
      title: "Song 13",
      album: "",
      artist: "Jason Gedge",
      composer: "Jason Gedge",
      copyright: "Jason Gedge",
    });

    assert.equal(score.parts.length, 2);
    assert.equal(score.parts[0].measures.length, 43);
    assert.equal(score.parts[0].measures[30].chords.length, 5);
    assert.equal(score.parts[0].measures[30].chords[0].notes.length, 1);
    assert.matches(score.parts[0].measures[30].chords[0].notes[0], {
      value: { dots: 0, name: "half" },
      options: {
        pitch: { step: "E", octave: 3, alterations: 0 },
        placement: { fret: 2, string: 4 },
        vibrato: true,
        dead: false,
        ghost: false,
        letRing: false,
        palmMute: false,
        staccato: false,
        hammerOnPullOff: false,
      },
    });
    assert.equal(score.parts[0].measures[30].chords[0].notes[0].toString(), "2");
  });
});
