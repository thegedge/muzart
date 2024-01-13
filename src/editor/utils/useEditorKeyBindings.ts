import { range } from "lodash";
import { useMemo } from "preact/hooks";
import { DecreaseNoteValue } from "../actions/DecreaseNoteValue";
import { DeleteNote } from "../actions/DeleteNote";
import { dotNoteAction } from "../actions/DotNote";
import { IncreaseNoteValue } from "../actions/IncreaseNoteValue";
import { setNoteFretAction } from "../actions/SetNoteFret";
import { toggleNoteFeatureAction } from "../actions/ToggleNoteFeature";
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
            application.playback.togglePlay();
          },
        },
      },

      Zoom: {
        "$mod + =": {
          name: "Zoom In",
          action() {
            application.canvas.setZoom(application.canvas.zoom * 1.2);
          },
        },

        "$mod + -": {
          name: "Zoom Out",
          action() {
            application.canvas.setZoom(application.canvas.zoom / 1.2);
          },
        },

        "$mod + 0": {
          name: "Reset Zoom",
          action() {
            application.canvas.setZoom(1);
            application.canvas.centerViewportOn();
          },
        },
      },

      Editing: {
        "$mod + z": {
          name: "Undo",
          when: "editorFocused && !isPlaying",
          action() {
            application.undo();
          },
        },

        "Shift + $mod + z": {
          name: "Redo",
          when: "editorFocused && !isPlaying",
          action() {
            application.redo();
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
            state.toggleEditingBend();
          },
        },

        "d": {
          name: "Set note dynamic",
          when: "editorFocused && !isPlaying",
          action() {
            state.toggleEditingDynamic();
          },
        },

        "n": {
          name: "Set note harmonic",
          when: "editorFocused && !isPlaying",
          action() {
            state.toggleEditingHarmonic();
          },
        },

        "h": {
          name: "Toggle Hammer-on / Pull-off",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("hammerOnPullOff").actionForState(application));
          },
        },

        "v": {
          name: "Toggle Vibrato",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("vibrato").actionForState(application));
          },
        },

        "l": {
          name: "Toggle Let Ring",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("letRing").actionForState(application));
          },
        },

        "p": {
          name: "Toggle Palm Mute",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("palmMute").actionForState(application));
          },
        },

        "x": {
          name: "Toggle Dead Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("dead").actionForState(application));
          },
        },

        "g": {
          name: "Toggle Ghost Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("ghost").actionForState(application));
          },
        },

        "s": {
          name: "Toggle Staccato",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleNoteFeatureAction("staccato").actionForState(application));
          },
        },

        "Escape": {
          when: "editingDynamic && !helpVisible",
          action() {
            state.toggleEditingDynamic();
          },
        },
      },

      // TODO support an easier way of having the same key binding in the same group
      Other1: {
        Escape: {
          when: "editingHarmonic && !helpVisible",
          action() {
            state.toggleEditingHarmonic();
          },
        },
      },
      Other2: {
        Escape: {
          when: "editingBend",
          action() {
            state.toggleEditingBend();
          },
        },
      },

      Navigation: {
        "ArrowLeft": {
          name: "Previous Chord",
          when: "editorFocused && !isPlaying",
          action() {
            application.selection.previousChord();
          },
        },

        "ArrowRight": {
          name: "Next Chord",
          when: "editorFocused && !isPlaying",
          action() {
            application.selection.nextChord();
          },
        },

        "ArrowUp": {
          name: "Higher Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.selection.previousNote();
          },
        },

        "ArrowDown": {
          name: "Lower Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.selection.nextNote();
          },
        },

        // TODO should these jump a visible page, or an actual page based on zoom level?
        "PageDown": {
          name: "Next Page",
          when: "editorFocused",
          action() {
            application.selection.nextPage();
          },
        },

        "PageUp": {
          name: "Previous Page",
          when: "editorFocused",
          action() {
            application.selection.previousPage();
          },
        },

        "Home": {
          name: "First Page",
          when: "editorFocused",
          action() {
            application.selection.update({ measureIndex: 0 });
          },
        },

        "End": {
          name: "Last Page",
          when: "editorFocused",
          action() {
            const part = application.selection.part;
            application.selection.update({ measureIndex: part && part.part.measures.length - 1 });
          },
        },

        "Shift + $mod + ArrowLeft": {
          name: "Previous Measure",
          when: "editorFocused",
          action() {
            application.selection.previousMeasure();
          },
        },

        "Shift + $mod + ArrowRight": {
          name: "Next Measure",
          when: "editorFocused",
          action() {
            application.selection.nextMeasure();
          },
        },

        "Alt + $mod + ArrowUp": {
          name: "Previous Part",
          when: "editorFocused",
          action() {
            application.selection.previousPart();
          },
        },

        "Alt + $mod + ArrowDown": {
          name: "Next Part",
          when: "editorFocused",
          action() {
            application.selection.nextPart();
          },
        },
      },

      Miscellaneous: {
        "Shift + ?": {
          when: "editorFocused && !editingBend",
          action() {
            state.toggleHelp();
          },
        },

        "Escape": {
          when: "helpVisible",
          action() {
            state.toggleHelp();
          },
        },

        "Shift + D": {
          name: "Toggle Debug View",
          when: "editorFocused",
          action() {
            application.debug.setEnabled(!application.debug.enabled);
          },
        },
      },
    }),
    [application, state],
  );

  useKeyBindings(keybindingGroups, state);

  return keybindingGroups;
};
