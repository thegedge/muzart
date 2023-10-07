import { flow, makeAutoObservable } from "mobx";
import { Point } from "../../layout";
import { load } from "../../loaders";
import * as notation from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { UndoStack } from "../../utils/UndoStack";
import { Action } from "../actions/Action";
import { SyncStorage } from "../storage/Storage";
import { TabStorage } from "../storage/TabStorage";
import { VIEW_STATE_CANVAS_SUBKEY, VIEW_STATE_LAST_TAB_SUBKEY, VIEW_STATE_NAMESPACE } from "../storage/namespaces";
import { CanvasState } from "../ui/misc/CanvasState";
import { DebugContext } from "./DebugContext";
import { Selection } from "./Selection";
import { UIState } from "./UIState";

export interface Hit<T> {
  /** The thing that was hit with a hit test */
  element: T;

  /** The hit point, relative to the element that was hit */
  point: Point;
}

export class Application {
  public loading = false;
  public error: Error | null = null;
  private currentUrl: URL | null = null;

  /** Various states the UI is in (e.g., key bindings overlay visible) */
  readonly state: UIState;

  /**
   * The undo stack for the editor.
   *
   * Expressed by a 2-tuple, where the first item is the "apply" action and the second item is the "undo" action.
   */
  private undoStack = new UndoStack<Action>();

  public debug: DebugContext = new DebugContext();
  public canvas: CanvasState;

  constructor(
    public settingsStorage: SyncStorage,
    public tabStorage: TabStorage,
    public selection: Selection,
    public playback: PlaybackController,
  ) {
    this.canvas = new CanvasState(this.settingsStorage);
    this.state = new UIState(this.playback);
    makeAutoObservable(this, undefined, { deep: false });
  }

  dispatch(action: Action) {
    if (action.canApply(this)) {
      this.undoStack.push(action);
      action.apply(this);
    }
  }

  undo() {
    const action = this.undoStack.undo();
    if (action) {
      action.undo(this);
    }
  }

  redo() {
    const action = this.undoStack.redo();
    if (action) {
      action.apply(this);
    }
  }

  loadScore = flow(function* (this: Application, url: string) {
    if (url.toString() == this.currentUrl?.toString()) {
      return;
    }

    try {
      this.currentUrl = new URL(url);
      this.error = null;
      this.loading = true;

      const blob: Blob = yield this.tabStorage.load(this.currentUrl);
      if (!blob) {
        throw new Error(`couldn't load tab: ${this.currentUrl.pathname}`);
      }

      const source = new File([blob], this.currentUrl.pathname);
      this.setScore((yield load(source)) as notation.Score);

      const lastTab = this.settingsStorage.get(VIEW_STATE_NAMESPACE, VIEW_STATE_LAST_TAB_SUBKEY);
      if (lastTab != url) {
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

  setScore(score: notation.Score | null) {
    this.selection.setScore(score);
    this.playback.reset();
  }
}
