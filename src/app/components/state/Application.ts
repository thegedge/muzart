import { makeAutoObservable } from "mobx";
import { load } from "../../../loaders";
import { Score } from "../../../notation";
import { PlaybackController } from "../../../playback/PlaybackController";
import * as layout from "../../layout";
import { Selection } from "./Selection";

export class Application {
  public selection: Selection = new Selection();
  public score: layout.Score | null = null;
  public loading = false;
  public error: Error | null = null;
  public playback = new PlaybackController();

  constructor() {
    makeAutoObservable(this, undefined, { deep: false, proxy: false });
  }

  *loadScore(source: string | File | URL): Generator<Promise<Score>> {
    try {
      this.error = null;
      this.loading = true;
      const score = (yield load(source)) as Score;
      this.setScore(layout.layout(score));
    } catch (error) {
      if (error instanceof Error) {
        this.error = error;
      } else {
        this.error = new Error(`${error}`);
      }
    } finally {
      this.loading = false;
    }
  }

  setScore(score: layout.Score | null) {
    this.score = score;
    this.selection.setScore(score);
  }
}
