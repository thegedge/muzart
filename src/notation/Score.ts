import { makeAutoObservable } from "mobx";
import { Part } from "./Part";

export interface ScoreOptions {
  parts: Part[];

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

  constructor(options: ScoreOptions) {
    this.parts_ = options.parts;
    this.comments = options.comments;
    this.title = options.title;
    this.subTitle = options.subTitle;
    this.artist = options.artist;
    this.album = options.album;
    this.composer = options.composer;
    this.copyright = options.copyright;
    this.transcriber = options.transcriber;
    this.instructions = options.instructions;

    makeAutoObservable(this, undefined, { deep: true });
  }

  get parts(): ReadonlyArray<Part> {
    return this.parts_;
  }

  addPart(part: Part, index = 0) {
    this.parts_.splice(index, 0, part);
  }

  removePart(part: Part) {
    const index = this.parts.indexOf(part);
    if (index >= 0) {
      this.parts_.splice(index, 1);
    }
  }
}
