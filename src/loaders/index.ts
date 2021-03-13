import { isString } from "lodash";
import { Score } from "../notation";
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
  MusicXML = "MusicXML",
  Unknown = "Unknown",
}

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

  if (filename?.endsWith(".xml") || filename?.endsWith(".musicxml") || mimeType === "application/xml") {
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
  }
  console.log(`Time to parse ${type}: ${performance.now() - now}ms`);
  return score;
}

function utf8StringFromBuffer(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}
