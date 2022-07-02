import { makeAutoObservable } from "mobx";
import { load } from "../../../loaders";
import { Score } from "../../../notation";
import { PlaybackController } from "../../../playback/PlaybackController";
import * as layout from "../../layout";
import { DebugContext } from "./DebugContext";
import { Selection } from "./Selection";

export class Application {
  public loading = false;
  public error: Error | null = null;
  public score: layout.Score | null = null;

  public debug: DebugContext = new DebugContext();

  constructor(public selection: Selection, public playback: PlaybackController) {
    makeAutoObservable(this, undefined, { deep: false });
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
