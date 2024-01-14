import { humanize, underscore } from "inflected";
import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export type BooleanFeatures<T> = {
  [K in keyof T]: T[K] extends boolean | undefined ? K : never;
}[keyof T] &
  string;

const METADATA: Record<BooleanFeatures<notation.NoteOptions>, { name: string; defaultKeyBinding: string }> = {
  dead: {
    name: "Toggle dead note",
    defaultKeyBinding: "x",
  },
  palmMute: {
    name: "Toggle palm mute",
    defaultKeyBinding: "p",
  },
  ghost: {
    name: "Toggle ghost note",
    defaultKeyBinding: "g",
  },
  hammerOnPullOff: {
    name: "Toggle hammer-on / pull-off",
    defaultKeyBinding: "h",
  },
  letRing: {
    name: "Toggle let ring",
    defaultKeyBinding: "l",
  },
  staccato: {
    name: "Toggle staccato",
    defaultKeyBinding: "s",
  },
  vibrato: {
    name: "Toggle vibrato",
    defaultKeyBinding: "v",
  },
};

export const toggleNoteFeatureAction = (feature: BooleanFeatures<notation.NoteOptions>) => {
  return class ToggleNoteFeature extends Action {
    static readonly name = METADATA[feature]?.name ?? `Toggle ${humanize(underscore(feature))}`;
    static readonly when = "editorFocused";
    static readonly defaultKeyBinding = METADATA[feature]?.defaultKeyBinding ?? null;

    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return chord && note ? new ToggleNoteFeature(chord, note, feature) : null;
    }

    private constructor(
      private chord: notation.Chord,
      private note: notation.Note,
      private feature: BooleanFeatures<notation.NoteOptions>,
    ) {
      super();
    }

    apply(_application: Application) {
      this.chord.changeNote(this.note.withChanges({ [this.feature]: !this.note[this.feature] }));
    }

    undo() {
      this.chord.changeNote(this.note);
    }
  };
};
