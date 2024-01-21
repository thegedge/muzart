import { makeAutoObservable } from "mobx";
import { PlaybackController } from "../../playback/PlaybackController";
import { PropertyPaths } from "../../utils/types";

/**
 * Captures all of the state that is related to the UI of the editor.
 */
export class UIState {
  /** The subject for a context menu, or `null` if the context menu isn't visible */
  public contextMenuSubject: unknown = null;
  public contextMenuX = 0;
  public contextMenuY = 0;

  /** Whether or not the key bindings overlay should be visible */
  public helpVisible = false;

  /** Whether or not a modal is available for a given subject */
  public modalSubject: unknown = null;
  public modalProperty = "";

  constructor(readonly playback: PlaybackController) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  get isPlaying() {
    return this.playback.playing;
  }

  get editorFocused() {
    // TODO this works...for now
    return document.activeElement?.tagName.toLowerCase() !== "input" && !this.contextMenuSubject;
  }

  showContextMenuFor(subject: unknown, offsetX = 0, offsetY = 0) {
    this.contextMenuSubject = subject;
    this.contextMenuX = offsetX;
    this.contextMenuY = offsetY;
  }

  hideContextMenu() {
    this.contextMenuSubject = null;
    this.contextMenuX = 0;
    this.contextMenuY = 0;
  }

  showModalFor<T>(subject: T, property: PropertyPaths<T, 3>) {
    this.modalSubject = subject;
    this.modalProperty = property;
  }

  hideModal() {
    this.modalSubject = null;
    this.modalProperty = "";
  }

  toggleHelp() {
    this.helpVisible = !this.helpVisible;
  }
}
