import { compact, range } from "lodash";
import { Chord, Measure, Note, Part, Score } from "../notation";

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

  const title = textQuery(document, score, "work/work-title");
  return {
    title,
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
    chords: chords(document, item),
  }));
}

function chords(document: Document, node: Node): Chord[] {
  const chords: Chord[] = [];

  // TODO turn this into an iterate, can probably do some fancy lodash thing to partition
  const result = document.evaluate("note", node, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
  let item = result.iterateNext();
  while (item) {
    let chord: Note[] = [];
    while (item) {
      const fret = textQuery(document, item, "notations/technical/fret");
      const string = textQuery(document, item, "notations/technical/string");
      if (fret && string) {
        chord.push({ fret: parseInt(fret), string: parseInt(string) });
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

function single(document: Document, node: Node, query: string): Node | null {
  const result = document.evaluate(query, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE);
  return result.singleNodeValue;
}

function many(document: Document, node: Node, query: string): Node[] {
  const result = document.evaluate(query, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  return compact(range(result.snapshotLength).map((index) => result.snapshotItem(index)));
}

function textQuery(document: Document, node: Node, query: string): string | undefined {
  const result = document.evaluate(query, node, null, XPathResult.ANY_UNORDERED_NODE_TYPE);
  return result.singleNodeValue?.textContent || undefined;
}

function contains(document: Document, node: Node, query: string): boolean {
  const result = document.evaluate(query, node, null, XPathResult.ANY_UNORDERED_NODE_TYPE);
  return !!result.singleNodeValue;
}
