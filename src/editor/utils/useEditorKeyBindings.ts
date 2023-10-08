import { range } from "lodash";
import { useMemo } from "preact/hooks";
import { DecreaseNoteValue } from "../actions/DecreaseNoteValue";
import { DeleteNote } from "../actions/DeleteNote";
import { IncreaseNoteValue } from "../actions/IncreaseNoteValue";
import { SetNoteFret } from "../actions/SetNoteFret";
import { ToggleNoteFeature } from "../actions/ToggleNoteFeature";
import { useApplicationState } from "./ApplicationStateContext";
import { KeyBindingGroups, useKeyBindings } from "./useKeyBindings";

export const useEditorKeyBindings = (): KeyBindingGroups => {
  const application = useApplicationState();
  const state = application.state;

  const keybindingGroups = useMemo<KeyBindingGroups>(
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
            application.dispatch(new DeleteNote());
          },
        },

        // TODO it would be nice to show this as just "+", but supporting that will be tricky because we can't just use `event.key`,
        //   otherwise we may accidentally call another action.
        "Shift + +": {
          name: "Decrease Note Value",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new DecreaseNoteValue());
          },
        },

        "-": {
          name: "Increase Note Value",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new IncreaseNoteValue());
          },
        },

        ...Object.fromEntries(
          range(10).map((fret) => [
            String(fret),
            {
              when: "editorFocused && !isPlaying",
              action() {
                application.dispatch(new SetNoteFret(fret));
              },
            },
          ]),
        ),

        "d": {
          name: "Set note dynamic",
          when: "editorFocused && !isPlaying && !helpVisible",
          action() {
            state.toggleEditingDynamic();
          },
        },

        "n": {
          name: "Set note harmonic",
          when: "editorFocused && !isPlaying && !helpVisible",
          action() {
            state.toggleEditingHarmonic();
          },
        },

        "h": {
          name: "Toggle Hammer-on / Pull-off",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("hammerOnPullOff"));
          },
        },

        "v": {
          name: "Toggle Vibrato",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("vibrato"));
          },
        },

        "l": {
          name: "Toggle Let Ring",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("letRing"));
          },
        },

        "p": {
          name: "Toggle Palm Mute",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("palmMute"));
          },
        },

        "x": {
          name: "Toggle Dead Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("dead"));
          },
        },

        "g": {
          name: "Toggle Ghost Note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("ghost"));
          },
        },

        "s": {
          name: "Toggle Staccato",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(new ToggleNoteFeature("staccato"));
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
      Other: {
        Escape: {
          when: "editingHarmonic && !helpVisible",
          action() {
            state.toggleEditingHarmonic();
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
          when: "editorFocused",
          action() {
            application.selection.nextChord();
          },
        },

        "ArrowUp": {
          name: "Higher Note",
          when: "editorFocused",
          action() {
            application.selection.previousNote();
          },
        },

        "ArrowDown": {
          name: "Lower Note",
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
          when: "editorFocused",
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
