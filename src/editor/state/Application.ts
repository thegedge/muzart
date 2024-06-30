import { isString } from "lodash";
import { flow, makeAutoObservable, reaction, when, type IReactionDisposer } from "mobx";
import { Box, layOutScore } from "../../layout";
import { load } from "../../loaders";
import * as notation from "../../notation";
import { PlaybackController } from "../../playback/PlaybackController";
import { SyncStorage, isRecord } from "../storage/Storage";
import { TabStorage } from "../storage/TabStorage";
import { CanvasState } from "../ui/canvas/CanvasState";
import { UndoStack } from "../utils/UndoStack";
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
  actionForContextMenu?(application: Application): Action | null;
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

  /** A disposer for the autorun that reflows the score whenever it changes */
  reflowDisposer: IReactionDisposer | null = null;

  /** The width of the document body */
  public bodyWidth = document.body.clientWidth;

  /** The height of the document body */
  public bodyHeight = document.body.clientHeight;

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

  dispose() {
    this.reflowDisposer?.();
    this.canvas.dispose();
  }

  get currentTabUrl() {
    return this.currentTabUrl_;
  }

  get isSmallScreen() {
    return this.bodyWidth <= 768 || this.bodyHeight <= 768;
  }

  setBodyDimensions(width: number, height: number) {
    this.bodyWidth = width;
    this.bodyHeight = height;
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

    this.loading = true;

    // We can't properly lay out a score until we know the width/height of the body
    yield Promise.all([
      when(() => this.bodyWidth != 0 && this.bodyHeight != 0),
      new Promise((resolve) => window.setTimeout(resolve, 200)),
    ]);

    try {
      this.error = null;
      this.currentTabUrl_ = new URL(url);

      const blob: Blob | null = yield this.tabStorage.load(this.currentTabUrl_);
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

  setScore(score: notation.Score | null) {
    // We wrap the layout in an `autorun` so that the layout is recomputed whenever the score changes.
    this.reflowDisposer?.();

    if (score) {
      this.reflowDisposer = reaction(
        () => {
          const layoutMode = this.isSmallScreen ? "compact" : "normal";
          return {
            score: score && layOutScore(score, [this.selection.partIndex], { layoutMode: layoutMode }),
            layoutMode,
            partIndex: this.selection.partIndex,
          };
        },
        (current, previous) => {
          this.selection.setScore(current.score);
          this.canvas.setUserSpaceSize(current.score.box);

          // TODO it would be nice to somehow maintain the same-ish viewport across layout changes, but for now we
          //  just reset every time the layout style changes.
          if (current.layoutMode !== previous?.layoutMode) {
            const box = current.score.box;
            const aspectRatio = this.canvas.canvasWidth / this.canvas.canvasHeight;
            this.canvas.setViewport(
              new Box(this.canvas.viewport.x, this.canvas.viewport.y, box.width, box.width / aspectRatio),
            );
          }
        },
        {
          fireImmediately: true,
        },
      );
    } else {
      this.selection.setScore(null);
    }

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
