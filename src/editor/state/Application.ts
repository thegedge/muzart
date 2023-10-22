import { isString } from "lodash";
import { flow, makeAutoObservable } from "mobx";
import { Point } from "../../layout";
import { load } from "../../loaders";
import * as notation from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { UndoStack } from "../../utils/UndoStack";
import { Action } from "../actions/Action";
import { SyncStorage, isRecord } from "../storage/Storage";
import { TabStorage } from "../storage/TabStorage";
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

  /** Various states the UI is in (e.g., key bindings overlay visible) */
  readonly state: UIState;

  public debug: DebugContext = new DebugContext();
  public canvas: CanvasState;

  /**
   * The undo stack for the editor.
   *
   * Expressed by a 2-tuple, where the first item is the "apply" action and the second item is the "undo" action.
   */
  private undoStack = new UndoStack<Action>();

  /** The URL of the tab currently loaded into this app context */
  private currentTabUrl_: URL | null = null;

  constructor(
    public settingsStorage: SyncStorage,
    public tabStorage: TabStorage,
    public selection: Selection,
    public playback: PlaybackController,
  ) {
    this.canvas = new CanvasState();
    this.state = new UIState(this.playback);
    makeAutoObservable(this, undefined, { deep: false });
  }

  get currentTabUrl() {
    return this.currentTabUrl_;
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
    if (this.selection.score != null && url.toString() == this.currentTabUrl_?.toString()) {
      return;
    }

    try {
      this.error = null;
      this.loading = true;
      this.currentTabUrl_ = new URL(url);

      const blob: Blob = yield this.tabStorage.load(this.currentTabUrl_);
      if (!blob) {
        throw new Error(`couldn't load tab: ${this.currentTabUrl_.pathname}`);
      }

      const source = new File([blob], this.currentTabUrl_.pathname);
      this.setScore((yield load(source)) as notation.Score);
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

  toJSON() {
    return {
      selection: this.selection.toJSON(),
      lastTabUrl: this.currentTabUrl?.toString(),
    };
  }

  fromJSON(value: Record<string, unknown>): void {
    if (isRecord(value.selection)) {
      this.selection.fromJSON(value.selection);
    }

    // TODO we're not properly restoring selection state when the tab is the same
    if (!this.currentTabUrl_ && isString(value.lastTabUrl)) {
      this.currentTabUrl_ = value.lastTabUrl ? new URL(value.lastTabUrl) : null;
    }
  }

  setScore(score: notation.Score | null, resetSelection = true) {
    this.selection.setScore(score, resetSelection);
    this.playback.reset();
  }
}
