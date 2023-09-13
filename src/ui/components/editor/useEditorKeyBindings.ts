import { mapValues, range } from "lodash";
import { useEffect, useMemo } from "preact/hooks";
import { createKeybindingsHandler } from "tinykeys";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { changeNoteAction } from "./actions/changeNoteAction";

export type KeyBindingAction = (event: KeyboardEvent) => void;

export interface KeyBinding {
  name?: string;
  action: KeyBindingAction;
}

export type KeyBindingGroups = Record<string, Record<string, KeyBinding>>;

export const useEditorKeyBindings = (): KeyBindingGroups => {
  const application = useApplicationState();

  const keybindingGroups = useMemo<KeyBindingGroups>(
    () => ({
      Playback: {
        Space: {
          name: "Toggle Playback",
          action() {
            application.playback.togglePlay();
          },
        },
      },

      Zoom: {
        "$mod+=": {
          name: "Zoom In",
          action() {
            application.canvas.setZoom(application.canvas.zoom * 1.2);
          },
        },

        "$mod+-": {
          name: "Zoom Out",
          action() {
            application.canvas.setZoom(application.canvas.zoom / 1.2);
          },
        },

        "$mod+0": {
          name: "Reset Zoom",
          action() {
            application.canvas.setZoom(1);
            application.canvas.centerViewportOn();
          },
        },
      },

      Editing: {
        ...Object.fromEntries(
          range(10).map((fret) => [
            String(fret),
            {
              action: changeNoteAction(application, fret),
            },
          ]),
        ),

        "$mod+z": {
          name: "Undo",
          action(event) {
            const action = application.undoStack.undo();
            if (action) {
              action[1](event);
            }
          },
        },

        "Shift+$mod+z": {
          name: "Redo",
          action(event) {
            const action = application.undoStack.redo();
            if (action) {
              action[0](event);
            }
          },
        },
      },

      Navigation: {
        "ArrowLeft": {
          name: "Previous Chord",
          action() {
            application.selection.previousChord();
          },
        },

        "ArrowRight": {
          name: "Next Chord",
          action() {
            application.selection.nextChord();
          },
        },

        "ArrowUp": {
          name: "Higher Note",
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
          action() {
            application.selection.nextPage();
          },
        },

        "PageUp": {
          name: "Previous Page",
          action() {
            application.selection.previousPage();
          },
        },

        "Home": {
          name: "First Page",
          action() {
            application.selection.update({ measureIndex: 0 });
          },
        },

        "End": {
          name: "Last Page",
          action() {
            const part = application.selection.part;
            application.selection.update({ measureIndex: part && part.part.measures.length - 1 });
          },
        },

        "Shift+$mod+ArrowLeft": {
          name: "Previous Measure",
          action() {
            application.selection.previousMeasure();
          },
        },

        "Shift+$mod+ArrowRight": {
          name: "Next Measure",
          action() {
            application.selection.nextMeasure();
          },
        },

        "Alt+$mod+ArrowUp": {
          name: "Previous Part",
          action() {
            application.selection.previousPart();
          },
        },

        "Alt+$mod+ArrowDown": {
          name: "Next Part",
          action() {
            application.selection.nextPart();
          },
        },
      },

      Miscellaneous: {
        "Shift+?": {
          action() {
            application.toggleHelp();
          },
        },

        "Shift+D": {
          name: "Toggle Debug View",
          action() {
            application.debug.setEnabled(!application.debug.enabled);
          },
        },
      },
    }),
    [application, application.canvas],
  );

  useEffect(() => {
    const actions = Object.fromEntries(
      Object.values(keybindingGroups)
        .flatMap((group) => Object.entries(group))
        .map(([key, { action }]) => [key, action]),
    );
    const listener = createKeybindingsHandler(mapValues(actions, preventDefault));

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [keybindingGroups]);

  return keybindingGroups;
};

const preventDefault = (f: KeyBindingAction): KeyBindingAction => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    f(event);
  };
};
