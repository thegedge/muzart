import { HarmonicStyle, NoteDynamic, NoteValue, NoteValueName } from "@muzart/notation";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { changeNoteValueAction } from "../../../actions/editing/note/ChangeNoteValue";
import { dotNoteAction } from "../../../actions/editing/note/DotNote";
import { EditBend } from "../../../actions/editing/note/EditBend";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { NoteValueIcon } from "../../misc/NoteValueIcon";
import { ChangeNotePaletteButton } from "./ChangeNotePaletteButton";
import { PaletteButton } from "./PaletteButton";
import { PaletteGroup } from "./PaletteGroup";
import { TogglePaletteButton } from "./TogglePaletteButton";

export const NoteSettingsForm = observer(() => {
  const application = useApplicationState();
  const chord = application.selection.chord?.chord;
  const note = application.selection.note?.note;
  if (note === undefined || chord == undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xl font-thin tracking-wider text-gray-500">
        Select a note
      </div>
    );
  }

  // TODO remove classnames from in here after bend, vibrato, etc; have icons
  return (
    <>
      <PaletteGroup name="Duration" className="flex flex-col border border-gray-600 px-2 pb-1">
        {Object.entries(NoteValueName).map(([key, value]) => {
          return (
            <PaletteButton
              key={key}
              className="max-h-8 max-w-8"
              active={chord.value.name == value}
              command={changeNoteValueAction(value)}
            >
              <NoteValueIcon noteValue={value} className="aspect-square w-full" />
            </PaletteButton>
          );
        })}

        <PaletteButton
          className="max-h-8 max-w-8"
          active={note.value.dots == 1}
          command={dotNoteAction(note.value.dots == 1 ? 0 : 1)}
        >
          <NoteValueIcon noteValue={NoteValue.fromNumber(4).dot()} className="aspect-square w-full" />
        </PaletteButton>

        <PaletteButton
          className="max-h-8 max-w-8"
          active={note.value.dots == 2}
          command={dotNoteAction(note.value.dots == 2 ? 0 : 2)}
        >
          <NoteValueIcon noteValue={NoteValue.fromNumber(4).withDots(2)} className="aspect-square w-full" />
        </PaletteButton>
      </PaletteGroup>

      <PaletteGroup name="Effects" className="flex border border-gray-600 px-2 pb-1">
        <PaletteButton command={EditBend}>Bend</PaletteButton>
        <TogglePaletteButton property="vibrato">Vibrato</TogglePaletteButton>
        <TogglePaletteButton property="letRing">Let Ring</TogglePaletteButton>
        <TogglePaletteButton property="dead">x</TogglePaletteButton>
        <TogglePaletteButton property="ghost">( )</TogglePaletteButton>
        <TogglePaletteButton property="staccato">Staccato</TogglePaletteButton>
        <TogglePaletteButton property="palmMute">P.M.</TogglePaletteButton>
        <TogglePaletteButton property="hammerOnPullOff">Hammer-on / Pull-off</TogglePaletteButton>
      </PaletteGroup>

      <PaletteGroup name="Harmonics" className="flex border border-gray-600 px-2 pb-1">
        {Object.entries(HarmonicStyle).map(([key, value]) => (
          <ChangeNotePaletteButton key={key} property="harmonic" value={value}>
            {childElementForHarmonicButton(value)}
          </ChangeNotePaletteButton>
        ))}
      </PaletteGroup>

      <PaletteGroup name="Dynamics" className="flex border border-gray-600 px-2 pb-1">
        {Object.entries(NoteDynamic).map(([key, value]) => (
          <ChangeNotePaletteButton key={key} className="italic" property="dynamic" value={value}>
            {value}
          </ChangeNotePaletteButton>
        ))}
      </PaletteGroup>
    </>
  );
});

const childElementForHarmonicButton = (style: HarmonicStyle): ReactNode => {
  switch (style) {
    case HarmonicStyle.Natural:
      return "⬥";
    case HarmonicStyle.ArtificialPlus5:
      return "A+5";
    case HarmonicStyle.ArtificialPlus7:
      return "A+7";
    case HarmonicStyle.ArtificialPlus12:
      return "A+12";
    case HarmonicStyle.Tapped:
      return "T.H.";
    case HarmonicStyle.Pinch:
      return "P.H.";
    case HarmonicStyle.Semi:
      return "S.H.";
  }
};
