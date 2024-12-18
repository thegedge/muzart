import { Chord, Measure, Note, Score, StaffDetails, changed, type ScoreOptions } from "@muzart/notation";
import { isString, pickBy, range } from "lodash-es";
import guitarPro from "./guitarpro";
import musicXml from "./musicxml";

export * from "./util/BufferCursor";

export async function load(source: File | Response | URL | string, type?: ScoreDataType): Promise<Score> {
  if (source instanceof Response) {
    const buffer = await source.arrayBuffer();
    return loadScore(buffer, type ?? determineScoreType(source));
  } else if (isString(source) || "hostname" in source) {
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
  Muzart = "Muzart",
  Unknown = "Unknown",
}

export const getFilenameAndMimeType = (source: File | Response) => {
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
};

const GUITAR_PRO_REGEX = /\.gp\d$/;

// TODO perhaps also support determining the type from the buffer?
export const determineScoreType = (source: File | Response) => {
  const { filename, mimeType } = getFilenameAndMimeType(source);

  if (GUITAR_PRO_REGEX.test(filename)) {
    return ScoreDataType.GuitarPro;
  } else if (filename.endsWith(".muz") || filename.endsWith(".muzart")) {
    return ScoreDataType.Muzart;
  } else if (filename.endsWith(".xml") || filename.endsWith(".musicxml") || mimeType === "application/xml") {
    return ScoreDataType.MusicXML;
  }

  return ScoreDataType.Unknown;
};

function loadScore(buffer: ArrayBuffer, type: ScoreDataType): Score {
  if (type == ScoreDataType.Unknown) {
    throw new Error("Unable to load score from buffer with unknown type");
  }

  console.time("loadScore");
  try {
    switch (type) {
      case ScoreDataType.MusicXML: {
        const score = musicXml(buffer).load();
        return postProcess(score);
      }
      case ScoreDataType.GuitarPro: {
        const score = guitarPro(buffer).load();
        return postProcess(score);
      }
      case ScoreDataType.Muzart: {
        const scoreData: ScoreOptions = JSON.parse(new TextDecoder().decode(buffer));
        return new Score(scoreData);
      }
    }
  } finally {
    console.timeEnd("loadScore");
  }
}

function postProcess(score: Score) {
  propagateStaffDetails(score);
  linkTiedNotes(score);
  return score;
}

function propagateStaffDetails(score: Score): void {
  const previousDetails: Partial<StaffDetails> = {};

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
    const trackedNotes: (Note | undefined)[] = range(part.lineCount).map(() => undefined);
    const trackedChords: (Chord | undefined)[] = range(part.lineCount).map(() => undefined);

    for (let measureIndex = part.measures.length - 1; measureIndex >= 0; --measureIndex) {
      const measure = part.measures[measureIndex];
      for (let chordIndex = measure.chords.length - 1; chordIndex >= 0; --chordIndex) {
        const chord = measure.chords[chordIndex];
        for (const note of chord.notes) {
          // TODO General scores don't have a placement, so need to track note pitch
          if (!note.placement) {
            continue;
          }

          // TODO should we instead be using `chord.changeNote` here?

          const updateTracking = note.tie?.type === "detect";
          const trackedNote = trackedNotes[note.placement.string];
          const trackedChord = trackedChords[note.placement.string];

          if (trackedNote && trackedChord) {
            note.tie = {
              type: "start",
              next: {
                note: trackedNote,
                chord: trackedChord,
              },
            };

            if (trackedNote.tie?.next) {
              trackedNote.tie = {
                type: "middle",
                previous: { note, chord },
                next: trackedNote.tie.next,
              };
            } else {
              trackedNote.tie = {
                type: "stop",
                previous: { note, chord },
              };
            }
          }

          if (updateTracking) {
            trackedNotes[note.placement.string] = note;
            trackedChords[note.placement.string] = chord;
          } else {
            trackedNotes[note.placement.string] = undefined;
            trackedChords[note.placement.string] = undefined;
          }
        }
      }
    }

    // TODO if we still have a tracked note, we probably need to let the user know the tie is invalid
  }
}
