import { makeAutoObservable } from "mobx";
import { Part } from "./Part";

export interface ScoreOptions {
  parts: Part[];

  comments?: string[];
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
  constructor(private options: ScoreOptions) {
    makeAutoObservable(this, undefined, { deep: true });
  }

  get parts() {
    return this.options.parts;
  }

  get comments() {
    return this.options.comments;
  }

  get title() {
    return this.options.title;
  }

  get subTitle() {
    return this.options.subTitle;
  }

  get artist() {
    return this.options.artist;
  }

  get album() {
    return this.options.album;
  }

  get composer() {
    return this.options.composer;
  }

  get copyright() {
    return this.options.copyright;
  }

  get transcriber() {
    return this.options.transcriber;
  }

  get instructions() {
    return this.options.instructions;
  }
}
