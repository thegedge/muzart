import { isString, mapValues, pickBy, range } from "lodash";
import { Changeable, changed, Chord, Note, Score, StaffDetails } from "../notation";
import loadGuitarPro4 from "./guitarpro4";
import loadMusicXml from "./musicxml";

export async function load(source: File | URL | string, type?: ScoreDataType): Promise<Score> {
  if (isString(source) || "hostname" in source) {
    const response = await fetch(source.toString());
    const buffer = await response.arrayBuffer();
    return loadScore(buffer, type ?? determineType(response));
  } else {
    const buffer = await source.arrayBuffer();
    return loadScore(buffer, type ?? determineType(source));
  }
}

export enum ScoreDataType {
  GuitarPro4 = "Guitar Pro 4",
  MusicXML = "MusicXML",
  Unknown = "Unknown",
}

// TODO perhaps also support determining the type from the buffer?
export function determineType(source: File | Response) {
  let filename: string | null | undefined;
  let mimeType: string | null | undefined;
  if ("name" in source) {
    filename = source.name;
    mimeType = source.type;
  } else {
    filename = new URL(source.url).pathname;
    mimeType = source.headers.get("Content-Type");
  }

  if (filename?.endsWith(".gp4")) {
    return ScoreDataType.GuitarPro4;
  } else if (filename?.endsWith(".xml") || filename?.endsWith(".musicxml") || mimeType === "application/xml") {
    return ScoreDataType.MusicXML;
  }

  return ScoreDataType.Unknown;
}

function loadScore(buffer: ArrayBuffer, type: ScoreDataType): Score {
  if (type == ScoreDataType.Unknown) {
    throw new Error("Unable to load score from buffer with unknown type");
  }

  let score;
  const now = performance.now();
  switch (type) {
    case ScoreDataType.MusicXML:
      score = loadMusicXml(utf8StringFromBuffer(buffer));
      break;
    case ScoreDataType.GuitarPro4:
      score = loadGuitarPro4(buffer);
  }
  console.log(`Time to parse ${type}: ${performance.now() - now}ms`);

  return postProcess(score);
}

type ChangeableValueType<T> = T extends Changeable<infer V> ? V : never;
type StaffDetailValues = {
  [Property in keyof StaffDetails]: ChangeableValueType<NonNullable<StaffDetails[Property]>>;
};

// TODO what to do about these in the context of an editor, where we won't want to do a full post process?

function postProcess(score: Score) {
  propagateStaffDetails(score);
  linkTiedNotes(score);
  return score;
}

function propagateStaffDetails(score: Score): void {
  // Set the staff details reference on all measures
  for (const part of score.parts) {
    let previousDetails: StaffDetailValues = {
      key: undefined,
      time: undefined,
      clef: undefined,
      tempo: undefined,
    };

    for (const measure of part.measures) {
      for (const [key, previousValue] of Object.entries(previousDetails)) {
        if (!previousValue) {
          continue;
        }

        const newValue = (measure.staffDetails as any)[key];
        (measure.staffDetails as any)[key] = changed(newValue?.value, previousValue);
      }

      Object.assign(previousDetails, mapValues(pickBy(measure.staffDetails), "value"));
    }
  }
}

function linkTiedNotes(score: Score): void {
  for (const part of score.parts) {
    // TODO copy + reverse is not the most performant way to iterate in reverse
    const trackedNotes: (Note | undefined)[] = range(part.lineCount).map(() => undefined);
    const trackedChords: (Chord | undefined)[] = range(part.lineCount).map(() => undefined);

    for (const measure of Array.from(part.measures).reverse()) {
      for (const chord of Array.from(measure.chords).reverse()) {
        for (const note of chord.notes) {
          // TODO General scores don't have a placement, so need to track note pitch
          if (!note.placement) {
            continue;
          }

          const trackedNote = trackedNotes[note.placement.string];
          const trackedChord = trackedChords[note.placement.string];

          if (note.tie?.type === "stop") {
            if (trackedNote) {
              note.options.tie = {
                type: "middle",
                next: trackedNote,
                nextChord: trackedChord,
              };

              if (trackedNote.tie) {
                trackedNote.tie.previous = note;
                trackedNote.tie.previousChord = chord;
              }
            }

            trackedNotes[note.placement.string] = note;
            trackedChords[note.placement.string] = chord;
          } else if (trackedNote) {
            note.options.tie = {
              type: "start",
              next: trackedNote,
              nextChord: trackedChord,
            };

            if (trackedNote.tie) {
              trackedNote.tie.previous = note;
              trackedNote.tie.previousChord = chord;
            }

            trackedNotes[note.placement.string] = undefined;
            trackedChords[note.placement.string] = undefined;
          }
        }
      }
    }
  }
}

function utf8StringFromBuffer(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
