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

  useEffect(() => {
    const listener = createKeybindingsHandler(
      mapValues(
        {
          // Playback ----------------------------------------------------------

          "Space": () => {
            application.playback.togglePlay();
          },

          // Zoom --------------------------------------------------------------

          "$mod+Equal": () => {
            state.setZoom(state.zoom * 1.2);
          },

          "$mod+Minus": () => {
            state.setZoom(state.zoom / 1.2);
          },

          "$mod+0": () => {
            state.setZoom(1);
            state.centerViewportOn();
          },

          // Navigation --------------------------------------------------------

          // TODO some of these shouldn't work when playing

          "ArrowLeft": () => {
            application.selection.previousChord();
          },
          "ArrowRight": () => {
            application.selection.nextChord();
          },
          "ArrowUp": () => {
            application.selection.previousNote();
          },
          "ArrowDown": () => {
            application.selection.nextNote();
          },

          // TODO should these jump a visible page, or an actual page based on zoom level?
          "PageDown": () => {
            application.selection.nextPage();
          },
          "PageUp": () => {
            application.selection.previousPage();
          },

          "Home": () => {
            application.selection.update({ measureIndex: 0 });
          },
          "End": () => {
            const part = application.selection.part;
            application.selection.update({ measureIndex: part && part.part.measures.length - 1 });
          },

          "$mod+Shift+ArrowLeft": () => {
            application.selection.previousMeasure();
          },
          "$mod+Shift+ArrowRight": () => {
            application.selection.nextMeasure();
          },

          "$mod+Alt+ArrowUp": () => {
            application.selection.previousPart();
          },
          "$mod+Alt+ArrowDown": () => {
            application.selection.nextPart();
          },

          // Debugging ---------------------------------------------------------

          "Shift+D": () => {
            application.debug.setEnabled(!application.debug.enabled);
          },
        },
        preventDefault,
      ),
    );

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [application, state]);

  return state;
};

const preventDefault = (f: (event: KeyboardEvent) => void): ((event: KeyboardEvent) => void) => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    f(event);
  };
};
