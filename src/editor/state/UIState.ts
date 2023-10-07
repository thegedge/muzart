import { makeAutoObservable } from "mobx";
import { PlaybackController } from "../../playback/PlaybackController";

/**
 * Captures all of the state that is related to the UI of the editor.
 */
export class UIState {
  /** Whether or not the key bindings overlay should be visible */
  public helpVisible = false;

  /** Whether or not to show the key bindings overlay */
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

  toggleEditingDynamic() {
    this.editingDynamic = !this.editingDynamic;
  }

  toggleHelp() {
    this.helpVisible = !this.helpVisible;
  }
}
