import {
  Clef,
  ClefSign,
  Key,
  NoteOptions,
  NoteValue,
  Pitch,
  Score,
  StaffDetails,
  Step,
  TimeSignature,
  type ChordOptions,
  type MeasureOptions,
  type PartOptions,
} from "@muzart/notation";
import { compact, range } from "lodash-es";
import { Loader } from "./Loader";

// TODO this is pretty slow, so perhaps a SAX-based parser
// TODO quite incomplete, but I can't find any good MusicXML files with all the guitar tablature elements, or programs that can produce them

const loader = (source: ArrayBuffer): Loader => {
  const decoder = new TextDecoder();
  const xmlString = decoder.decode(source);
  return {
    load() {
      return load(xmlString);
    },
  };
};

export default loader;

function load(source: string): Score {
  const parser = new DOMParser();
  const document = parser.parseFromString(source, "application/xml");
  if (document.documentElement.nodeName == "parsererror") {
    throw new Error(document.documentElement.innerText);
  }

  const score = single(document, document, "//score-partwise");
  if (!score) {
    return new Score({ parts: [] });
  }

  const title = textQueryMaybe(document, score, "work/work-title");
  const composer = textQueryMaybe(document, score, "identification/creator[@type='composer']");
  return new Score({
    title,
    composer,
    parts: parts(document, score),
  });
}

function parts(document: Document, node: Node): PartOptions[] {
  return many(document, node, "part").map((item, index) => {
    const id = textQueryMaybe(document, item, "@id");
    const name = textQueryMaybe(document, node, `part-list/score-part[@id='${id}']/part-name`);
    const staffLines = textQueryMaybe(document, item, "//staff-details/staff-lines");

    let instrument;
    const attributes = single(document, item, "measure[1]/attributes");
    const maybeTuning = attributes && tuning(document, attributes);
    if (maybeTuning) {
      // TODO how to determine the kind of instrument?
      instrument = {
        type: "string",
        midiPreset: 24, // TODO where to get midi preset?
        volume: 1,
        tuning: maybeTuning,
      } as const;
    } else {
      // TODO maybe introduce a default instrument without any tuning
      const STANDARD_TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"];
      instrument = {
        type: "string",
        midiPreset: 25, // Acoustic guitar
        volume: 0.8125,
        tuning: STANDARD_TUNING.map((pitch) => Pitch.fromScientificNotation(pitch)),
      } as const;
    }

    return {
      name: name ?? `Part ${index + 1}`,
      lineCount: parseInt(staffLines || "6"), // TODO default to previous in same staff?
      measures: measures(document, item),
      instrument,
    };
  });
}

function measures(document: Document, node: Node): MeasureOptions[] {
  return many(document, node, "measure").map((item, index) => ({
    chords: chords(document, item),
    number: index + 1,
    staffDetails: staves(document, item)[0],
  }));
}

function staves(document: Document, node: Node): StaffDetails[] {
  const attributesNode = single(document, node, "attributes");
  if (!attributesNode) {
    return [{}];
  }

  // TODO track old values for these
  const maybeChanged = <T>(value: T | undefined) => {
    if (value) {
      return { value, changed: true };
    }
  };

  const staff: StaffDetails = {
    clef: maybeChanged(clef(document, attributesNode)),
    key: maybeChanged(key(document, attributesNode)),
    time: maybeChanged(time(document, attributesNode)),
    tempo: maybeChanged(tempo(document, node)),
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
    return new TimeSignature(NoteValue.fromNumber(parseInt(beatType)), parseInt(beats));
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

function tuning(document: Document, node: Node): Pitch[] | undefined {
  const tuning = many(document, node, "staff-details/staff-tuning");
  // TODO use `line` attribute to order, but for now we assume correct ordering
  return tuning.map((pitch) => {
    const step = textQuery(document, pitch, "tuning-step") as unknown as Step;
    const octave = parseInt(textQuery(document, pitch, "tuning-octave"));
    const alter = parseInt(textQueryMaybe(document, pitch, "tuning-alter") || "0");
    return new Pitch(step, octave, alter);
  });
}

function chords(document: Document, node: Node): ChordOptions[] {
  const chords: ChordOptions[] = [];

  // TODO turn this into an iterate, can probably do some fancy lodash thing to partition
  const result = document.evaluate("note", node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
  let item = result.iterateNext();
  while (item) {
    const notes: NoteOptions[] = [];
    while (item) {
      if (contains(document, item, "pitch") && contains(document, item, "duration")) {
        notes.push(note(document, item));
      }

      item = result.iterateNext();
      if (item && !contains(document, item, "chord")) {
        break;
      }
    }

    if (notes.length > 0) {
      chords.push({ notes, value: notes[0].value });
    }
  }

  return chords;
}

function note(document: Document, node: Node): NoteOptions {
  const step = textQuery(document, node, "pitch/step") as unknown as Step;
  const octave = parseInt(textQuery(document, node, "pitch/octave"));
  const alter = parseInt(textQueryMaybe(document, node, "pitch/alter") || "0");
  const pitch = new Pitch(step, octave, alter);

  // any so we can typecheck on `Duration.fromString` below, relying on MusicXML's validations to ensure correctness
  const duration = textQuery(document, node, "type");

  const options: NoteOptions = {
    pitch,
    value: NoteValue.fromString(duration),
  };

  const fret = textQueryMaybe(document, node, "notations/technical/fret");
  const string = textQueryMaybe(document, node, "notations/technical/string");
  if (fret && string) {
    options.placement = { fret: parseInt(fret), string: parseInt(string) };
  }

  const tie = textQueryMaybe(document, node, "tie/@type");
  options.tie = tie as NoteOptions["tie"];

  return options;
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
