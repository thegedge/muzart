import { range } from "lodash";
import { useMemo } from "preact/hooks";
import { Action } from "../actions/Action";
import { DecreaseNoteValue } from "../actions/editing/DecreaseNoteValue";
import { DeleteNote } from "../actions/editing/DeleteNote";
import { DotNote } from "../actions/editing/DotNote";
import { EditBend } from "../actions/editing/EditBend";
import { EditDynamic } from "../actions/editing/EditDynamic";
import { EditHarmonic } from "../actions/editing/EditHarmonic";
import { HideModal } from "../actions/editing/HideModal";
import { IncreaseNoteValue } from "../actions/editing/IncreaseNoteValue";
import { Redo } from "../actions/editing/Redo";
import { SetNoteFret } from "../actions/editing/SetNoteFret";
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
import { HideContextMenu } from "../actions/other/HideContextMenu";
import { HideHelp } from "../actions/other/HideHelp";
import { ToggleDebug } from "../actions/other/ToggleDebug";
import { ToggleHelp } from "../actions/other/ToggleHelp";
import { TogglePlayback } from "../actions/playback/TogglePlayback";
import { ResetZoom } from "../actions/zoom/ResetZoom";
import { ZoomIn } from "../actions/zoom/ZoomIn";
import { ZoomOut } from "../actions/zoom/ZoomOut";
import { Application, Command } from "../state/Application";
import { useApplicationState } from "./ApplicationStateContext";
import { KeyBinding, KeyBindings, useKeyBindings } from "./useKeyBindings";

type OtherContext = Action;

// The amount of time, in milliseconds, after which pressing a fret key will start a new note instead of combining
// with the previous note.
const COMBINE_PREVIOUS_TIME_THRESHOLD_MS = 500;

let previousAction: Action | null = null;
let previousActionTime = 0;

export const useEditorKeyBindings = (): KeyBindings<OtherContext> => {
  const application = useApplicationState();
  const state = application.state;

  const keyBindings = useMemo(
    () =>
      Object.entries(ACTION_GROUPS).flatMap(([group, actions]) => {
        return actions
          .filter((action) => action.defaultKeyBinding)
          .map(
            (actionFactory) =>
              ({
                name: actionFactory.name,
                group,
                when: actionFactory.when,
                key: actionFactory.defaultKeyBinding!,
                action(_context) {
                  const action = actionFactory.actionForState(application);
                  application.dispatch(action);

                  // TODO we kind of want to clear this when some action is dispatched to the application outside of a key binding
                  previousAction = action;
                  previousActionTime = Date.now();
                },
              }) as KeyBinding<OtherContext>,
          );
      }),
    [application],
  );

  useKeyBindings(keyBindings, state);

  return keyBindings;
};

const ACTION_GROUPS: Record<string, Command[]> = {
  Playback: [TogglePlayback],
  Zoom: [ZoomIn, ZoomOut, ResetZoom],
  Editing: [
    Undo,
    Redo,
    DeleteNote,
    DecreaseNoteValue,
    IncreaseNoteValue,
    EditBend,
    EditDynamic,
    EditHarmonic,
    ...range(10).map((fret) => {
      return class {
        static readonly name = "Set note fret";
        static readonly when = "editorFocused && !isPlaying";
        static readonly defaultKeyBinding = String(fret);

        static actionForState(application: Application) {
          const instrument = application.selection.part?.part.instrument;
          const chord = application.selection.chord?.chord;
          if (!instrument || !chord) {
            return null;
          }

          let actualFret = fret;
          if (previousAction instanceof SetNoteFret) {
            const previousFret = previousAction.fret ?? NaN;
            if (previousFret < 10 && Date.now() - previousActionTime < COMBINE_PREVIOUS_TIME_THRESHOLD_MS) {
              // TODO in this scenario we want to combine this action with the previous one, but currently we just push
              actualFret = 10 * previousFret + fret;
            }
          }

          return new SetNoteFret(instrument, chord, application.selection.noteIndex + 1, actualFret);
        }
      };
    }),
    class {
      static readonly name = "Dot note";
      static readonly when = "editorFocused && !isPlaying";
      static readonly defaultKeyBinding = ".";

      static actionForState(application: Application) {
        const chord = application.selection.chord?.chord;
        const note = application.selection.note?.note;
        if (!chord || !note) {
          return null;
        }

        let actualDots = note.value.dots == 0 ? 1 : 0;
        if (previousAction instanceof DotNote) {
          if (Date.now() - previousActionTime < COMBINE_PREVIOUS_TIME_THRESHOLD_MS) {
            actualDots = previousAction.dots == 3 ? 0 : previousAction.dots + 1;
          }
        }

        return new DotNote(chord, note, actualDots);
      }
    },
    toggleNoteFeatureAction("hammerOnPullOff"),
    toggleNoteFeatureAction("vibrato"),
    toggleNoteFeatureAction("letRing"),
    toggleNoteFeatureAction("palmMute"),
    toggleNoteFeatureAction("dead"),
    toggleNoteFeatureAction("ghost"),
    toggleNoteFeatureAction("staccato"),
    HideModal,
  ],

  Navigation: [
    PreviousChord,
    NextChord,
    PreviousNote,
    NextNote,
    PreviousPage,
    NextPage,
    FirstPage,
    LastPage,
    PreviousMeasure,
    NextMeasure,
    PreviousPart,
    NextPart,
  ],

  Miscellaneous: [ToggleHelp, ToggleDebug, HideHelp, HideContextMenu],
};
