import { makeAutoObservable } from "mobx";
import { PlaybackController } from "../../playback/PlaybackController";

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

  /** Whether or not the note harmonic palette is visible */
  public editingHarmonic = false;

  /** Whether or not the note dynamic palette is visible */
  public editingDynamic = false;

  /** Whether or not the bend modal is visible */
  public editingBend = false;

  constructor(readonly playback: PlaybackController) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  get isPlaying() {
    return this.playback.playing;
  }

  get editorFocused() {
    // TODO this works...for now
    return document.activeElement?.tagName.toLowerCase() !== "input";
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

  toggleEditingDynamic() {
    if (this.editingDynamic) {
      this.editingDynamic = false;
    } else {
      this.editingDynamic = true;
      this.editingHarmonic = false;
      this.editingBend = false;
    }
  }

  toggleEditingHarmonic() {
    if (this.editingHarmonic) {
      this.editingHarmonic = false;
    } else {
      this.editingDynamic = false;
      this.editingHarmonic = true;
      this.editingBend = false;
    }
  }

  toggleEditingBend() {
    if (this.editingBend) {
      this.editingBend = false;
    } else {
      this.editingDynamic = false;
      this.editingHarmonic = false;
      this.editingBend = true;
    }
  }

  toggleHelp() {
    this.helpVisible = !this.helpVisible;
  }
}
