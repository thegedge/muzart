import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

type BooleanFeatures<T> = {
  [K in keyof T]: T[K] extends boolean | undefined ? K : never;
}[keyof T] &
  string;

export type BooleanNoteFeatures = BooleanFeatures<Omit<notation.NoteOptions, "text">>;

const METADATA: Record<BooleanNoteFeatures, { name: string; defaultKeyBinding: string }> = {
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

export const toggleNoteFeatureAction = (feature: BooleanNoteFeatures) => {
  return class ToggleNoteFeature extends Action {
    static readonly name = METADATA[feature].name;
    static readonly when = "editorFocused";
    static readonly defaultKeyBinding = METADATA[feature].defaultKeyBinding;

    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return chord && note ? new ToggleNoteFeature(chord, note, feature) : null;
    }

    private constructor(
      private chord: notation.Chord,
      private note: notation.Note,
      private feature: BooleanNoteFeatures,
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
