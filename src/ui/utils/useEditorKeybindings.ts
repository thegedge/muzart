import { mapValues } from "lodash";
import { useEffect, useMemo } from "preact/hooks";
import { createKeybindingsHandler } from "tinykeys";
import { CanvasState } from "../components/misc/CanvasState";
import { useApplicationState } from "./ApplicationStateContext";

export const useEditorKeybindings = () => {
  const application = useApplicationState();
  const state = useMemo(() => new CanvasState(application.settingsStorage), []);

  useEffect(() => {
    return () => state.dispose();
  }, [state]);

  const keybindingGroups = useMemo(
    () => ({
      Playback: {
        Space: {
          name: "Toggle Playback",
          action: () => {
            application.playback.togglePlay();
          },
        },
      },

      Zoom: {
        "$mod+Equal": {
          name: "Zoom In",
          action: () => {
            state.setZoom(state.zoom * 1.2);
          },
        },

        "$mod+Minus": {
          name: "Zoom Out",
          action: () => {
            state.setZoom(state.zoom / 1.2);
          },
        },

        "$mod+0": {
          name: "Reset Zoom",
          action: () => {
            state.setZoom(1);
            state.centerViewportOn();
          },
        },
      },

      Navigation: {
        "ArrowLeft": {
          name: "Previous Chord",
          action: () => {
            application.selection.previousChord();
          },
        },

        "ArrowRight": {
          name: "Next Chord",
          action: () => {
            application.selection.nextChord();
          },
        },

        "ArrowUp": {
          name: "Higher Note",
          action: () => {
            application.selection.previousNote();
          },
        },

        "ArrowDown": {
          name: "Lower Note",
          action: () => {
            application.selection.nextNote();
          },
        },

        // TODO should these jump a visible page, or an actual page based on zoom level?
        "PageDown": {
          name: "Next Page",
          action: () => {
            application.selection.nextPage();
          },
        },

        "PageUp": {
          name: "Previous Page",
          action: () => {
            application.selection.previousPage();
          },
        },

        "Home": {
          name: "First Page",
          action: () => {
            application.selection.update({ measureIndex: 0 });
          },
        },

        "End": {
          name: "Last Page",
          action: () => {
            const part = application.selection.part;
            application.selection.update({ measureIndex: part && part.part.measures.length - 1 });
          },
        },

        "$mod+Shift+ArrowLeft": {
          name: "Previous Measure",
          action: () => {
            application.selection.previousMeasure();
          },
        },

        "$mod+Shift+ArrowRight": {
          name: "Next Measure",
          action: () => {
            application.selection.nextMeasure();
          },
        },

        "$mod+Alt+ArrowUp": {
          name: "Previous Part",
          action: () => {
            application.selection.previousPart();
          },
        },

        "$mod+Alt+ArrowDown": {
          name: "Next Part",
          action: () => {
            application.selection.nextPart();
          },
        },
      },

      Debugging: {
        "Shift+D": {
          name: "Toggle Debug View",
          action: () => {
            application.debug.setEnabled(!application.debug.enabled);
          },
        },
      },
    }),
    [application, state],
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

  return state;
};

const preventDefault = (f: (event: KeyboardEvent) => void): ((event: KeyboardEvent) => void) => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    f(event);
  };
};
