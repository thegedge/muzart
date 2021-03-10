import { compact, range } from "lodash";
import { Chord, Clef, ClefSign, Key, Measure, Note, Part, Score, StaffDetails, Step, TimeSignature } from "../notation";

export default function loadMusicXml(source: string): Score {
  const parser = new DOMParser();
  const document = parser.parseFromString(source, "application/xml");
  if (document.documentElement.nodeName == "parsererror") {
    throw new Error(document.documentElement.innerText);
  }

  const score = single(document, document, "//score-partwise");
  if (!score) {
    return { parts: [] };
  }

  const title = textQueryMaybe(document, score, "work/work-title");
  const composer = textQueryMaybe(document, score, "identification/creator[@type='composer']");
  return {
    title,
    composer,
    parts: parts(document, score),
  };
}

function parts(document: Document, node: Node): Part[] {
  return many(document, node, "part").map((item) => ({
    measures: measures(document, item),
  }));
}

function measures(document: Document, node: Node): Measure[] {
  return many(document, node, "measure").map((item) => ({
    staveDetails: staves(document, item),
    chords: chords(document, item),
  }));
}

function staves(document: Document, node: Node): StaffDetails[] | undefined {
  const attributesNode = single(document, node, "attributes");
  if (!attributesNode) {
    return;
  }

  const staffLines = textQueryMaybe(document, attributesNode, "staff-details/staff-lines");
  const staff: StaffDetails = {
    clef: clef(document, attributesNode),
    key: key(document, attributesNode),
    tuning: tuning(document, attributesNode),
    time: time(document, attributesNode),
    lineCount: parseInt(staffLines || "6"), // TODO default to previous in same staff?
    tempo: tempo(document, node),
  };

  return [staff];
}

function tempo(document: Document, node: Node): number | undefined {
  const tempo = textQueryMaybe(document, node, "direction/sound/@tempo");
  if (tempo) {
    return parseInt(tempo);
  }
}

function clef(document: Document, node: Node): Clef | undefined {
  const sign = textQueryMaybe(document, node, "clef/sign");
  const line = textQueryMaybe(document, node, "clef/line");
  if (sign && line) {
    return {
      sign: sign as ClefSign,
      line: parseInt(line),
    };
  }
}

function time(document: Document, node: Node): TimeSignature | undefined {
  const beats = textQueryMaybe(document, node, "time/beats");
  const beatType = textQueryMaybe(document, node, "time/beat-type");
  if (beats && beatType) {
    return {
      beats: parseInt(beats),
      beatType: parseInt(beatType),
    };
  }
}

function key(document: Document, node: Node): Key | undefined {
  const fifths = textQueryMaybe(document, node, "key/fifths");
  const mode = textQueryMaybe(document, node, "key/mode");
  if (fifths && mode) {
    return {
      fifths: parseInt(fifths),
      mode: mode as Key["mode"],
    };
  }
}

function tuning(document: Document, node: Node): Note[] | undefined {
  const staffLines = many(document, node, "staff-details/tuning");
  if (staffLines) {
    // TODO use `line` attribute to order, but for now we assume correct ordering
    return staffLines.map((line) => ({
      step: textQuery(document, line, "tuning-step") as Step,
      octave: parseInt(textQuery(document, line, "tuning-octave")),
      duration: 1,
    }));
  }
}

function chords(document: Document, node: Node): Chord[] {
  const chords: Chord[] = [];

  // TODO turn this into an iterate, can probably do some fancy lodash thing to partition
  const result = document.evaluate("note", node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
  let item = result.iterateNext();
  while (item) {
    let chord: Note[] = [];
    while (item) {
      if (contains(document, item, "pitch")) {
        chord.push(note(document, item));
      }

      item = result.iterateNext();
      if (item && !contains(document, item, "chord")) {
        break;
      }
    }

    if (chord.length == 1) {
      chords.push(chord[0]);
    } else if (chord.length > 1) {
      chords.push(chord);
    }
  }

  return chords;
}

function note(document: Document, node: Node): Note {
  const note: Note = {
    step: textQuery(document, node, "pitch/step") as Step,
    octave: parseInt(textQuery(document, node, "pitch/octave")),
    duration: parseInt(textQuery(document, node, "duration")),
  };

  const fret = textQueryMaybe(document, node, "notations/technical/fret");
  const string = textQueryMaybe(document, node, "notations/technical/string");
  if (fret && string) {
    note.fret = { fret: parseInt(fret), string: parseInt(string) };
  }

  const tie = textQueryMaybe(document, node, "tie/@type");
  note.tie = tie as Note["tie"];

  return note;
}

function single(document: Document, node: Node, query: string): Node | null {
  const result = document.evaluate(query, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE);
  return result.singleNodeValue;
}

function many(document: Document, node: Node, query: string): Node[] {
  const result = document.evaluate(query, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  return compact(range(result.snapshotLength).map((index) => result.snapshotItem(index)));
}

function textQuery(document: Document, node: Node, query: string): string {
  const result = document.evaluate(query, node, null, XPathResult.ANY_UNORDERED_NODE_TYPE);
  if (!result.singleNodeValue?.textContent) {
    throw new Error(`query ${query} failed to find content`);
  }

  return result.singleNodeValue.textContent;
}

function textQueryMaybe(document: Document, node: Node, query: string): string | undefined {
  const result = document.evaluate(query, node, null, XPathResult.ANY_UNORDERED_NODE_TYPE);
  return result.singleNodeValue?.textContent || undefined;
}

function contains(document: Document, node: Node, query: string): boolean {
  const result = document.evaluate(query, node, null, XPathResult.ANY_UNORDERED_NODE_TYPE);
  return !!result.singleNodeValue;
}
