import { isString, pickBy, range } from "lodash";
import { changed, Chord, Measure, Note, Score, StaffDetails } from "../notation";
import guitarPro from "./guitarpro";
import musicXml from "./musicxml";

export async function load(source: File | URL | string, type?: ScoreDataType): Promise<Score> {
  if (isString(source) || "hostname" in source) {
    const response = await fetch(source.toString());
    const buffer = await response.arrayBuffer();
    return loadScore(buffer, type ?? determineScoreType(response));
  } else {
    const buffer = await source.arrayBuffer();
    return loadScore(buffer, type ?? determineScoreType(source));
  }
}

export enum ScoreDataType {
  GuitarPro = "Guitar Pro",
  MusicXML = "MusicXML",
  Unknown = "Unknown",
}

export function getFilenameAndMimeType(source: File | Response) {
  let filename: string | null;
  let mimeType: string | null;
  if ("name" in source) {
    filename = source.name;
    mimeType = source.type;
  } else {
    filename = new URL(source.url).pathname;
    mimeType = source.headers.get("Content-Type");
  }
  return { filename, mimeType };
}

const GUITAR_PRO_REGEX = /\.gp\d$/;

// TODO perhaps also support determining the type from the buffer?
export function determineScoreType(source: File | Response) {
  const { filename, mimeType } = getFilenameAndMimeType(source);

  if (GUITAR_PRO_REGEX.test(filename)) {
    return ScoreDataType.GuitarPro;
  } else if (filename.endsWith(".xml") || filename.endsWith(".musicxml") || mimeType === "application/xml") {
    return ScoreDataType.MusicXML;
  }

  return ScoreDataType.Unknown;
}

function loadScore(buffer: ArrayBuffer, type: ScoreDataType): Score {
  if (type == ScoreDataType.Unknown) {
    throw new Error("Unable to load score from buffer with unknown type");
  }

  console.time("loadScore");
  try {
    let score;
    switch (type) {
      case ScoreDataType.MusicXML:
        score = musicXml(buffer).load();
        break;
      case ScoreDataType.GuitarPro:
        score = guitarPro(buffer).load();
    }

    return postProcess(score);
  } finally {
    console.timeEnd("loadScore");
  }
}

// TODO refactor these for the editor editor, where we won't want to do a full post process

function postProcess(score: Score) {
  propagateStaffDetails(score);
  linkTiedNotes(score);
  return score;
}

function propagateStaffDetails(score: Score): void {
  const previousDetails: StaffDetails = {};

  const updateStaffDetails = <K extends keyof StaffDetails>(key: K, measure: Measure): void => {
    const previousValue = previousDetails[key];
    if (previousValue) {
      const newValue = measure.staffDetails[key];
      measure.staffDetails[key] = changed(newValue?.value, previousValue.value) as StaffDetails[K];
    }
  };

  // Set the staff details reference on all measures
  for (const part of score.parts) {
    previousDetails.key = undefined;
    previousDetails.time = undefined;
    previousDetails.clef = undefined;
    previousDetails.tempo = undefined;

    for (const measure of part.measures) {
      updateStaffDetails("clef", measure);
      updateStaffDetails("key", measure);
      updateStaffDetails("tempo", measure);
      updateStaffDetails("time", measure);
      Object.assign(previousDetails, pickBy(measure.staffDetails));
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
