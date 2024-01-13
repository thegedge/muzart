import { range } from "lodash";
import { useMemo } from "preact/hooks";
import { DecreaseNoteValue } from "../actions/editing/DecreaseNoteValue";
import { DeleteNote } from "../actions/editing/DeleteNote";
import { dotNoteAction } from "../actions/editing/DotNote";
import { IncreaseNoteValue } from "../actions/editing/IncreaseNoteValue";
import { Redo } from "../actions/editing/Redo";
import { setNoteFretAction } from "../actions/editing/SetNoteFret";
import { ToggleEditBend } from "../actions/editing/ToggleEditBend";
import { ToggleEditDynamic } from "../actions/editing/ToggleEditDynamic";
import { ToggleEditHarmonic } from "../actions/editing/ToggleEditHarmonic";
import { toggleNoteFeatureAction } from "../actions/editing/ToggleNoteFeature";
import { Undo } from "../actions/editing/Undo";
import { FirstPage } from "../actions/navigation/FirstPage";
import { LastPage } from "../actions/navigation/LastPage";
import { NextChord } from "../actions/navigation/NextChord";
import { NextMeasure } from "../actions/navigation/NextMeasure";
import { NextNote } from "../actions/navigation/NextNote";
import { NextPage } from "../actions/navigation/NextPage";
import { NextPart } from "../actions/navigation/NextPart";
import { PreviousChord } from "../actions/navigation/PreviousChord";
import { PreviousMeasure } from "../actions/navigation/PreviousMeasure";
import { PreviousNote } from "../actions/navigation/PreviousNote";
import { PreviousPage } from "../actions/navigation/PreviousPage";
import { PreviousPart } from "../actions/navigation/PreviousPart";
import { ToggleDebug } from "../actions/other/ToggleDebug";
import { ToggleHelp } from "../actions/other/ToggleHelp";
import { TogglePlayback } from "../actions/playback/TogglePlayback";
import { ResetZoom } from "../actions/zoom/ResetZoom";
import { ZoomIn } from "../actions/zoom/ZoomIn";
import { ZoomOut } from "../actions/zoom/ZoomOut";
import { useApplicationState } from "./ApplicationStateContext";
import { KeyBinding, KeyBindingGroups, useKeyBindings } from "./useKeyBindings";

type OtherContext = {
  fret?: number;
  dots?: number;
} | void;

// The amount of time, in milliseconds, after which pressing a fret key will start a new note instead of combining
// with the previous note.
const COMBINE_PREVIOUS_TIME_THRESHOLD_MS = 500;

export const useEditorKeyBindings = (): KeyBindingGroups<OtherContext> => {
  const application = useApplicationState();
  const state = application.state;

  const keybindingGroups = useMemo<KeyBindingGroups<OtherContext>>(
    () => ({
      Playback: {
        " ": {
          name: "Toggle Playback",
          when: "editorFocused",
          action() {
            application.dispatch(TogglePlayback);
          },
        },
      },

      Zoom: {
        "$mod + =": {
          name: "Zoom In",
          action() {
            application.dispatch(ZoomIn);
          },
        },

        "$mod + -": {
          name: "Zoom Out",
          action() {
            application.dispatch(ZoomOut);
          },
        },

        "$mod + 0": {
          name: "Reset Zoom",
          action() {
            application.dispatch(ResetZoom);
          },
        },
      },

      Editing: {
        "$mod + z": {
          name: "Undo",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(Undo);
          },
        },

        "Shift + $mod + z": {
          name: "Redo",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(Redo);
          },
        },

        "Delete": {
          name: "Delete Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(DeleteNote);
          },
        },

        // TODO it would be nice to show this as just "+", but supporting that will be tricky because we can't just use `event.key`,
        //   otherwise we may accidentally call another action.
        "Shift + +": {
          name: "Decrease Note Value",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(DecreaseNoteValue);
          },
        },

        "-": {
          name: "Increase Note Value",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(IncreaseNoteValue);
          },
        },

        ...Object.fromEntries(
          range(10).map((fret) => [
            String(fret),
            {
              when: "editorFocused && !isPlaying",
              action(context) {
                let actualFret = fret;
                if (context.previous?.other?.fret !== undefined) {
                  const previousFret = context.previous.other?.fret ?? NaN;
                  if (previousFret < 10 && Date.now() - context.previous.when < COMBINE_PREVIOUS_TIME_THRESHOLD_MS) {
                    actualFret = 10 * previousFret + fret;
                  }
                }

                application.dispatch(setNoteFretAction(actualFret));
                return { fret: actualFret };
              },
            } satisfies KeyBinding<OtherContext>,
          ]),
        ),

        ".": {
          name: "Dot note",
          when: "editorFocused && !isPlaying",
          action(context) {
            const note = application.selection.note?.note;
            if (!note) {
              return;
            }

            let actualDots = note.value.dots == 0 ? 1 : 0;
            if (context.previous?.other?.dots !== undefined) {
              if (Date.now() - context.previous.when < COMBINE_PREVIOUS_TIME_THRESHOLD_MS) {
                actualDots = context.previous.other?.dots == 3 ? 0 : context.previous.other?.dots + 1;
              }
            }

            application.dispatch(dotNoteAction(actualDots));
            return { dots: actualDots };
          },
        },

        "b": {
          name: "Edit note bend",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(ToggleEditBend);
          },
        },

        "d": {
          name: "Set note dynamic",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(ToggleEditDynamic);
          },
        },

        "n": {
          name: "Set note harmonic",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(ToggleEditHarmonic);
          },
        },

        "h": {
          name: "Toggle Hammer-on / Pull-off",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("hammerOnPullOff"));
          },
        },

        "v": {
          name: "Toggle Vibrato",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("vibrato"));
          },
        },

        "l": {
          name: "Toggle Let Ring",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("letRing"));
          },
        },

        "p": {
          name: "Toggle Palm Mute",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("palmMute"));
          },
        },

        "x": {
          name: "Toggle Dead Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("dead"));
          },
        },

        "g": {
          name: "Toggle Ghost Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("ghost"));
          },
        },

        "s": {
          name: "Toggle Staccato",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("staccato"));
          },
        },

        "Escape": {
          when: "editingDynamic && !helpVisible",
          action() {
            application.dispatch(ToggleEditDynamic);
          },
        },
      },

      // TODO support an easier way of having the same key binding in the same group
      Other1: {
        Escape: {
          when: "editingHarmonic && !helpVisible",
          action() {
            application.dispatch(ToggleEditHarmonic);
          },
        },
      },
      Other2: {
        Escape: {
          when: "editingBend",
          action() {
            application.dispatch(ToggleEditBend);
          },
        },
      },

      Navigation: {
        "ArrowLeft": {
          name: "Previous Chord",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(PreviousChord);
          },
        },

        "ArrowRight": {
          name: "Next Chord",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(NextChord);
          },
        },

        "ArrowUp": {
          name: "Higher Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(PreviousNote);
          },
        },

        "ArrowDown": {
          name: "Lower Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(NextNote);
          },
        },

        // TODO should these jump a visible page, or an actual page based on zoom level?
        "PageDown": {
          name: "Next Page",
          when: "editorFocused",
          action() {
            application.dispatch(NextPage);
          },
        },

        "PageUp": {
          name: "Previous Page",
          when: "editorFocused",
          action() {
            application.dispatch(PreviousPage);
          },
        },

        "Home": {
          name: "First Page",
          when: "editorFocused",
          action() {
            application.dispatch(FirstPage);
          },
        },

        "End": {
          name: "Last Page",
          when: "editorFocused",
          action() {
            application.dispatch(LastPage);
          },
        },

        "Shift + $mod + ArrowLeft": {
          name: "Previous Measure",
          when: "editorFocused",
          action() {
            application.dispatch(PreviousMeasure);
          },
        },

        "Shift + $mod + ArrowRight": {
          name: "Next Measure",
          when: "editorFocused",
          action() {
            application.dispatch(NextMeasure);
          },
        },

        "Alt + $mod + ArrowUp": {
          name: "Previous Part",
          when: "editorFocused",
          action() {
            application.dispatch(PreviousPart);
          },
        },

        "Alt + $mod + ArrowDown": {
          name: "Next Part",
          when: "editorFocused",
          action() {
            application.dispatch(NextPart);
          },
        },
      },

      Miscellaneous: {
        "Shift + ?": {
          when: "editorFocused && !editingBend",
          action() {
            application.dispatch(ToggleHelp);
          },
        },

        "Escape": {
          when: "helpVisible",
          action() {
            application.dispatch(ToggleHelp);
          },
        },

        "Shift + D": {
          name: "Toggle Debug View",
          when: "editorFocused",
          action() {
            application.dispatch(ToggleDebug);
          },
        },
      },
    }),
    [application],
  );

  useKeyBindings(keybindingGroups, state);

  return keybindingGroups;
};
