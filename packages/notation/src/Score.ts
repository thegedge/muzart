import { makeAutoObservable } from "mobx";
import { Part, type PartOptions } from "./Part";
import { initArray } from "./utils";

export interface ScoreOptions {
  parts?: PartOptions[];
  comments?: string;
  title?: string;
  subTitle?: string;
  artist?: string;
  album?: string;
  composer?: string;
  copyright?: string;
  transcriber?: string;
  instructions?: string;
}

export class Score {
  private parts_: Part[];

  public comments: string | undefined;
  public title: string | undefined;
  public subTitle: string | undefined;
  public artist: string | undefined;
  public album: string | undefined;
  public composer: string | undefined;
  public copyright: string | undefined;
  public transcriber: string | undefined;
  public instructions: string | undefined;

  constructor(options?: ScoreOptions) {
    this.parts_ = initArray(Part, options?.parts);
    this.comments = options?.comments;
    this.title = options?.title;
    this.subTitle = options?.subTitle;
    this.artist = options?.artist;
    this.album = options?.album;
    this.composer = options?.composer;
    this.copyright = options?.copyright;
    this.transcriber = options?.transcriber;
    this.instructions = options?.instructions;

    makeAutoObservable(this, undefined, { deep: true });
  }

  get parts(): ReadonlyArray<Part> {
    return this.parts_;
  }

  addPart(part: Part, index?: number) {
    if (index === undefined) {
      this.parts_.push(part);
      return this.parts.length - 1;
    } else {
      this.parts_.splice(index, 0, part);
      return index;
    }
  }

  removePart(part: Part) {
    const index = this.parts.indexOf(part);
    if (index >= 0) {
      this.parts_.splice(index, 1);
    }
  }

  toJSON() {
    return {
      parts: this.parts,
      comments: this.comments,
      title: this.title,
      subTitle: this.subTitle,
      artist: this.artist,
      album: this.album,
      composer: this.composer,
      copyright: this.copyright,
      transcriber: this.transcriber,
      instructions: this.instructions,
    };
  }
}
