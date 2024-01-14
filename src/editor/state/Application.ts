import { isString } from "lodash";
import { flow, makeAutoObservable } from "mobx";
import { load } from "../../loaders";
import * as notation from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { UndoStack } from "../../utils/UndoStack";
import { SyncStorage, isRecord } from "../storage/Storage";
import { TabStorage } from "../storage/TabStorage";
import { CanvasState } from "../ui/canvas/CanvasState";
import { DebugContext } from "./DebugContext";
import { Selection } from "./Selection";
import { UIState } from "./UIState";

/** An action that can be applied to the current application state */
export type Action = {
  /** Apply this action to the given application state */
  apply(application: Application): void;
};

/** An action that can be applied to the current application state and then undone */
export type UndoableAction = Action & {
  /** Undo this action */
  undo(): void;
};

/** A type that can (potentially) construct an action for the current application state */
export type Command = {
  name: string;
  when: string;
  defaultKeyBinding: string | null;
  actionForState(application: Application): Action | null;
};

/** The root state of the Muzart editor */
export class Application {
  /** Whether the application is currently loading a score */
  public loading = false;

  /** Set if an error occurred while loading a score */
  public error: Error | null = null;

  /** Various states the UI is in (e.g., key bindings overlay visible) */
  readonly state: UIState;

  /** Context for debugging the application */
  public debug: DebugContext = new DebugContext();

  /** The state of the editor's canvas */
  public canvas: CanvasState;

  /**
   * The undo stack for the editor.
   *
   * Expressed by a 2-tuple, where the first item is the "apply" action and the second item is the "undo" action.
   */
  private undoStack = new UndoStack<UndoableAction>();

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

  dispatch(actionOrCommand: Action | Command | null) {
    if (!actionOrCommand) {
      return;
    }

    if (isCommand(actionOrCommand)) {
      this.dispatch(actionOrCommand.actionForState(this));
      return;
    }

    if (isUndoableAction(actionOrCommand)) {
      this.undoStack.push(actionOrCommand);
    }

    actionOrCommand.apply(this);
  }

  undo() {
    const action = this.undoStack.undo();
    if (action) {
      action.undo();
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

const isCommand = (value: unknown): value is Command => {
  return isRecord(value) && typeof value.actionForState == "function";
};

const isAction = (value: unknown): value is Action & Record<string, unknown> => {
  return isRecord(value) && typeof value.apply == "function";
};

const isUndoableAction = (value: unknown): value is UndoableAction => {
  return isAction(value) && typeof value.undo == "function";
};
