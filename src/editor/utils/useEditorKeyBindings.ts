import { range } from "lodash";
import { useEffect, useMemo } from "preact/hooks";
import { IS_MAC } from "../../utils/platform";
import { DecreaseNoteValue } from "../actions/DecreaseNoteValue";
import { DeleteNote } from "../actions/DeleteNote";
import { IncreaseNoteValue } from "../actions/IncreaseNoteValue";
import { SetNoteFret } from "../actions/SetNoteFret";
import { ToggleNoteFeature } from "../actions/ToggleNoteFeature";
import { UIState } from "../state/UIState";
import { useApplicationState } from "./ApplicationStateContext";

export interface KeyBinding {
  name?: string;
  when?: string;
  action: () => void;
}

export const KEY_BINDING_SEPARATOR = " + ";

export type KeyBindingGroups = Record<string, Record<string, KeyBinding>>;

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
          when: "editorFocused && !isPlaying",
          action() {
            state.toggleEditingDynamic();
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
          name: "Close note dynamic palette",
          when: "editingDynamic",
          action() {
            state.toggleEditingDynamic();
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

        // TODO there are gonna be other uses for escape, so an object keyed by keys isn't ideal
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

  useEffect(() => {
    const bindingGroups = Object.values(keybindingGroups)
      .flatMap((group) => Object.entries(group))
      .reduce(
        (bindings, [key, binding]) => {
          bindings[key] ??= [];
          bindings[key].push(binding);
          return bindings;
        },
        {} as Record<string, KeyBinding[]>,
      );

    const listener = (event: KeyboardEvent) => {
      const pieces = [];
      if (event.shiftKey) {
        pieces.push("Shift");
      }

      if (event.altKey) {
        pieces.push("Alt");
      }

      if ((IS_MAC && event.metaKey) || (!IS_MAC && event.ctrlKey)) {
        pieces.push("$mod");
      }

      pieces.push(event.key);

      const sequence = pieces.join(KEY_BINDING_SEPARATOR);
      console.log("Key sequence", sequence);
      const bindings = bindingGroups[sequence];
      if (bindings) {
        // TODO we should write a test to guarantee no overlaps here, but need to encode all possible states the UI can be in.
        //   Once we do that, we can change this from `filter` to `find`.
        const applicableBindings = bindings.filter((binding) => {
          if (!binding.when) {
            return true;
          }

          const pieces = binding.when.split(" && ");
          return pieces.every((piece) => {
            return piece[0] == "!" ? !state[piece.substring(1) as keyof UIState] : state[piece as keyof UIState];
          });
        });

        if (applicableBindings.length > 1) {
          console.warn("Multiple bindings found for sequence", sequence, ":", applicableBindings);
          return;
        }

        if (applicableBindings.length == 1) {
          event.stopPropagation();
          event.preventDefault();
          applicableBindings[0].action();
        }
      }
    };

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [keybindingGroups, state]);

  return keybindingGroups;
};
