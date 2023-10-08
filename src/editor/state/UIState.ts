import { makeAutoObservable } from "mobx";
import { PlaybackController } from "../../playback/PlaybackController";

/**
 * Captures all of the state that is related to the UI of the editor.
 */
export class UIState {
  /** Whether or not the key bindings overlay should be visible */
  public helpVisible = false;

  /** Whether or not the note harmonic palette is visible */
  public editingHarmonic = false;

  /** Whether or not the note dynamic palette is visible */
  public editingDynamic = false;

  constructor(readonly playback: PlaybackController) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  get isPlaying() {
    return this.playback.playing;
  }

  get editorFocused() {
    // TODO this works...for now
    return document.activeElement == document.body;
  }

  toggleEditingHarmonic() {
    if (this.editingHarmonic) {
      this.editingHarmonic = false;
    } else {
      this.editingDynamic = false;
      this.editingHarmonic = true;
    }
  }

  toggleEditingDynamic() {
    if (this.editingDynamic) {
      this.editingDynamic = false;
    } else {
      this.editingHarmonic = false;
      this.editingDynamic = true;
    }
  }

  toggleHelp() {
    this.helpVisible = !this.helpVisible;
  }
}
