import { flow, makeAutoObservable } from "mobx";
import * as layout from "../../layout";
import { Point } from "../../layout";
import { load } from "../../loaders";
import * as notation from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { SyncStorage } from "../storage/Storage";
import { TabStorage } from "../storage/TabStorage";
import { VIEW_STATE_CANVAS_SUBKEY, VIEW_STATE_LAST_TAB_SUBKEY, VIEW_STATE_NAMESPACE } from "../storage/namespaces";
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

  public debug: DebugContext = new DebugContext();

  constructor(
    public settingsStorage: SyncStorage,
    public tabStorage: TabStorage,
    public selection: Selection,
    public playback: PlaybackController,
  ) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  loadScore = flow(function* (this: Application, url: URL) {
    try {
      this.error = null;
      this.loading = true;

      const blob: Blob = yield this.tabStorage.load(url);
      if (!blob) {
        throw new Error(`couldn't load tab: ${url.pathname}`);
      }

      const source = new File([blob], url.pathname);
      this.selection.setScore((yield load(source)) as notation.Score);

      const lastTab = this.settingsStorage.get(VIEW_STATE_NAMESPACE, VIEW_STATE_LAST_TAB_SUBKEY);
      if (lastTab != url.toString()) {
        this.settingsStorage.set(VIEW_STATE_NAMESPACE, VIEW_STATE_LAST_TAB_SUBKEY, url.toString());
        this.settingsStorage.delete(VIEW_STATE_NAMESPACE, VIEW_STATE_CANVAS_SUBKEY);
        this.selection.reset();
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

  setScore(score: notation.Score | null) {
    this.playback.stop();
    this.selection.setScore(score);
  }
}
