import { range } from "lodash";
import { useEffect, useMemo } from "preact/hooks";
import { IS_MAC } from "../../utils/platform";
import { decreaseNoteValue } from "../actions/decreaseNoteValue";
import { deleteNote } from "../actions/deleteNote";
import { increaseNoteValue } from "../actions/increaseNoteValue";
import { setNoteFret } from "../actions/setNoteFret";
import { toggleHammerOnPullOff } from "../actions/toggleHammerOnPullOff";
import { Application } from "../state/Application";
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
          name: "Delete note",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(deleteNote());
          },
        },

        // TODO it would be nice to show this as just "+", but supporting that will be tricky because we can't just use `event.key`,
        //   otherwise we may accidentally call another action.
        "Shift + +": {
          name: "Decrease Note Value",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(decreaseNoteValue());
          },
        },

        "-": {
          name: "Increase Note Value",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(increaseNoteValue());
          },
        },

        ...Object.fromEntries(
          range(10).map((fret) => [
            String(fret),
            {
              when: "editorFocused && !isPlaying",
              action() {
                application.dispatch(setNoteFret(fret));
              },
            },
          ]),
        ),

        "h": {
          name: "Toggle hammer-on / pull-off",
          when: "editorFocused && !isPlaying",
          action() {
            application.dispatch(toggleHammerOnPullOff());
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
            application.toggleHelp();
          },
        },

        // TODO there are gonna be other uses for escape, so an object keyed by keys isn't ideal
        "Escape": {
          when: "helpVisible",
          action() {
            application.toggleHelp();
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
    [application],
  );

  useEffect(() => {
    const bindings = Object.fromEntries(
      Object.values(keybindingGroups)
        .flatMap((group) => Object.entries(group))
        .map(([key, binding]) => [key, binding]),
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
      const binding = bindings[sequence];
      if (binding) {
        if (binding.when) {
          const pieces = binding.when.split(" && ");
          const validState = pieces.every((piece) => {
            return piece[0] == "!"
              ? !application[piece.substring(1) as keyof Application]
              : application[piece as keyof Application];
          });

          if (!validState) {
            return;
          }
        }

        event.stopPropagation();
        event.preventDefault();
        binding.action();
      }
    };

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [keybindingGroups, application]);

  return keybindingGroups;
};