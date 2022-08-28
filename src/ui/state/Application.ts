import { last } from "lodash";
import { makeAutoObservable } from "mobx";
import * as layout from "../../layout";
import { load } from "../../loaders";
import { Score } from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { LocalStorage } from "../storage/LocalStorage";
import { TABS_NAMESPACE, VIEW_STATE_NAMESPACE } from "../storage/namespaces";
import { Storage } from "../storage/Storage";
import { DebugContext } from "./DebugContext";
import { Selection } from "./Selection";

export class Application {
  public loading = false;
  public error: Error | null = null;
  public score: layout.Score | null = null;

  public debug: DebugContext = new DebugContext();
  public storage: Storage = new LocalStorage(globalThis.localStorage);

  constructor(public selection: Selection, public playback: PlaybackController) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  *loadScore(source: string | File | URL) {
    try {
      this.error = null;
      this.loading = true;

      const score = (yield load(source)) as Score;
      this.setScore(layout.layout(score));

      if (source instanceof File) {
        const buffer = (yield source.arrayBuffer()) as ArrayBuffer;
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        this.storage.setBlob(TABS_NAMESPACE, source.name, blob);
        this.storage.set(VIEW_STATE_NAMESPACE, "lastTab", source.name);
      } else if (typeof source == "string") {
        const [_songs, songName] = source.split("/");
        this.storage.set(VIEW_STATE_NAMESPACE, "lastTab", songName);
      } else {
        const songName = last(source.pathname.split("/"));
        if (songName) {
          this.storage.set(VIEW_STATE_NAMESPACE, "lastTab", songName);
        }
      }
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
