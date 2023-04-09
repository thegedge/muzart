import { last } from "lodash";
import { flow, makeAutoObservable } from "mobx";
import * as layout from "../../layout";
import { Point } from "../../layout";
import { load } from "../../loaders";
import { Score } from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { AsyncStorage, SyncStorage } from "../storage/Storage";
import { TABS_NAMESPACE, VIEW_STATE_CANVAS_SUBKEY, VIEW_STATE_NAMESPACE } from "../storage/namespaces";
import { DebugContext } from "./DebugContext";
import { Selection } from "./Selection";

export interface Hit<T> {
  /** The thing that was hit with a hit test */
  element: T;

  /** The hit point, relative to the element that was hit */
  point: Point;
}

export class Application {
  public loading = false;
  public error: Error | null = null;
  public score: layout.Score | null = null;

  public debug: DebugContext = new DebugContext();

  constructor(
    public settingsStorage: SyncStorage,
    public tabStorage: AsyncStorage,
    public selection: Selection,
    public playback: PlaybackController
  ) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  loadScore = flow(function* (this: Application, source: string | File | URL) {
    try {
      this.error = null;
      this.loading = true;

      const score = (yield load(source)) as Score;
      this.setScore(layout.layOutScore(score));

      let tabName: string;
      if (source instanceof File) {
        const buffer = (yield source.arrayBuffer()) as ArrayBuffer;
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        yield this.tabStorage.store(TABS_NAMESPACE, source.name, blob);
        tabName = source.name;
      } else if (typeof source == "string") {
        const [_songs, songName] = source.split("/");
        tabName = songName;
      } else {
        const songName = last(source.pathname.split("/"));
        if (!songName) {
          throw new Error(`Couldn't load tab from URL ${source.pathname}`);
        }

        tabName = songName;
      }

      const lastTab = this.settingsStorage.get(VIEW_STATE_NAMESPACE, "lastTab");
      if (lastTab != tabName) {
        this.settingsStorage.delete(VIEW_STATE_NAMESPACE, VIEW_STATE_CANVAS_SUBKEY);
      }
      this.settingsStorage.set(VIEW_STATE_NAMESPACE, "lastTab", tabName);
    } catch (error) {
      if (error instanceof Error) {
        this.error = error;
      } else {
        this.error = new Error(`${error}`);
      }
    } finally {
      this.loading = false;
    }
  });

  hitTest(point: Point, element: layout.AllElements | undefined = this.selection.part): Hit<layout.AllElements> | null {
    if (!element?.box.contains(point)) {
      return null;
    }

    if ("children" in element && element.children.length > 0) {
      const adjustedPoint = { x: point.x - element.box.x, y: point.y - element.box.y };
      for (const child of element.children) {
        const hit = this.hitTest(adjustedPoint, child);
        if (hit) {
          return hit;
        }
      }
    }

    if (element.type == "Group") {
      return null;
    }

    return { element, point };
  }

  setScore(score: layout.Score | null) {
    this.playback.stop();
    this.score = score;
    this.selection.setScore(score);
  }
}
