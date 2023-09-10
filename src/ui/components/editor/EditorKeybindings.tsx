import { mapValues, range } from "lodash";
import { Fragment } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { createKeybindingsHandler } from "tinykeys";
import { Application } from "../../state/Application";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const EditorKeybindings = (_props: Record<string, never>) => {
  const [helpVisible, setHelpVisible] = useState(false);
  const toggleHelp = useCallback(() => setHelpVisible((v) => !v), [setHelpVisible]);
  const keybindingGroups = useEditorKeybindings(toggleHelp);

  return (
    <div
      className={`absolute z-50 bg-black/80 backdrop-blur-md text-gray-300 top-0 bottom-0 left-0 right-0 overflow-clip p-4 ${
        helpVisible ? "block" : "hidden"
      }`}
    >
      <h1 className="text-2xl my-4 font-bold text-center">Keyboard shortcuts</h1>
      <div className="flex items-center justify-start w-full h-full overflow-auto">
        <div className="flex flex-col flex-wrap gap-4 justify-start items-stretch h-full">
          {Object.entries(keybindingGroups).map(([groupName, group]) => {
            const bindingsWithName = Object.entries(group).filter(([_binding, { name }]) => !!name);
            if (bindingsWithName.length == 0) {
              return null;
            }

            return (
              <div key={groupName} className="rounded-lg py-2 px-4 bg-white/10">
                <h2 className="text-3 font-bold mb-2 border-b-2 border-b-white/25">{groupName}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {bindingsWithName.map(([binding, { name }]) => (
                    <Fragment key={binding}>
                      <div>
                        <KeyBinding binding={binding} />
                      </div>
                      <span>{name}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const KeyBinding = (props: { binding: string }) => {
  const pieces = props.binding.split("+");
  return (
    <div className={`grid grid-cols-${pieces.length} gap-x-0.5 w-fit`}>
      {pieces.map((piece) => (
        <span className="inline-block border rounded border-b-2 bg-white/5 px-1 text-center">{presentKey(piece)}</span>
      ))}
    </div>
  );
};

const presentKey = (key: string): string => {
  const isMac = window.navigator.userAgent.includes("Macintosh");
  switch (key) {
    case "$mod":
      return isMac ? presentKey("Command") : presentKey("Control");
    case "ArrowDown":
      return "↓";
    case "ArrowLeft":
      return "←";
    case "ArrowRight":
      return "→";
    case "ArrowUp":
      return "↑";
    case "Alt":
      return isMac ? "⌥" : "Alt";
    case "Command":
      return "⌘";
    case "Control":
      return isMac ? "⌃" : "Ctrl";
    case "Return":
      return "⏎";
    case "Shift":
      return isMac ? "⇧" : "Shift";
    case "Space":
      return "␣";
    default:
      return key;
  }
};

type KeyBindingAction = (event: KeyboardEvent) => void;

interface KeyBinding {
  name?: string;
  action: KeyBindingAction;
}

type KeybindingGroups = Record<string, Record<string, KeyBinding>>;

const changeNoteAction = (application: Application, fret: number): KeyBindingAction => {
  return () => {
    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    if (instrument && chord) {
      // TODO assuming a stringed + fretted instrument below. Will need to fix eventually.
      const string = application.selection.noteIndex + 1;
      const tuning = instrument.tuning[application.selection.noteIndex];
      chord.changeNote({
        pitch: tuning.adjust(fret),
        placement: {
          fret,
          string,
        },
        dead: undefined,
      });
    }
  };
};

const useEditorKeybindings = (toggleHelp: () => void): KeybindingGroups => {
  const application = useApplicationState();

  const keybindingGroups = useMemo(
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

        "$mod+Shift+ArrowLeft": {
          name: "Previous Measure",
          action() {
            application.selection.previousMeasure();
          },
        },

        "$mod+Shift+ArrowRight": {
          name: "Next Measure",
          action() {
            application.selection.nextMeasure();
          },
        },

        "$mod+Alt+ArrowUp": {
          name: "Previous Part",
          action() {
            application.selection.previousPart();
          },
        },

        "$mod+Alt+ArrowDown": {
          name: "Next Part",
          action() {
            application.selection.nextPart();
          },
        },
      },

      Miscellaneous: {
        "Shift+?": {
          name: "Toggle Help",
          action() {
            toggleHelp();
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
    [application, application.canvas, toggleHelp],
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

const preventDefault = (f: (event: KeyboardEvent) => void): ((event: KeyboardEvent) => void) => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    f(event);
  };
};
