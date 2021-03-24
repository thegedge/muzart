import { isString, mapValues, pickBy } from "lodash";
import { Changeable, changed, Score, StaffDetails } from "../notation";
import loadGuitarPro4 from "./guitarpro4";
import loadMusicXml from "./musicxml";

export async function load(source: File | URL | string, type?: ScoreDataType): Promise<Score | null> {
  if (isString(source) || "hostname" in source) {
    const response = await fetch(source.toString());
    const buffer = await response.arrayBuffer();
    return loadScore(buffer, type ?? determineType(response));
  } else if ("type" in source) {
    const buffer = await source.arrayBuffer();
    return loadScore(buffer, type ?? determineType(source));
  }

  return null;
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

function postProcess(score: Score) {
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

  return score;
}

function utf8StringFromBuffer(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
