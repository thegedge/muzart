import { observer } from "mobx-react-lite";
import { ComponentChildren } from "preact";
import { HTMLAttributes } from "preact/compat";
import * as notation from "../../../notation";
import { HarmonicStyle, NoteDynamic, NoteValue, NoteValueName } from "../../../notation";
import { changeNoteAction } from "../../actions/editing/ChangeNote";
import { changeNoteValueAction } from "../../actions/editing/ChangeNoteValue";
import { dotNoteAction } from "../../actions/editing/DotNote";
import { EditBend } from "../../actions/editing/EditBend";
import { BooleanNoteFeatures, toggleNoteFeatureAction } from "../../actions/editing/ToggleNoteFeature";
import { NoteValueIcon } from "../../resources/note_values";
import { Command } from "../../state/Application";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const SelectionPalette = (_props: Record<string, never>) => {
  return (
    <div className="palette flex h-full w-full min-w-24 flex-col gap-4 p-4 text-sm">
      <NoteSettings />
    </div>
  );
};

const NoteSettings = observer(() => {
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

const PaletteGroup = (props: HTMLAttributes<HTMLFieldSetElement>) => {
  const { children, ...fieldsetProps } = props;
  return (
    <fieldset {...fieldsetProps} className="rounded border border-gray-600 bg-white/5 px-2 pb-1">
      {fieldsetProps.name && <legend className="px-1">{fieldsetProps.name}</legend>}
      <div className="flex flex-wrap gap-x-2 gap-y-2 py-2">{children}</div>
    </fieldset>
  );
};

type PaletteButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "command" | "onClick"> & {
  active?: boolean;
  command: Command;
};

function ChangeNotePaletteButton<PropertyT extends keyof notation.NoteOptions>(
  props: Omit<PaletteButtonProps, "property" | "command"> & {
    property: PropertyT;
    value: notation.NoteOptions[PropertyT];
  },
) {
  const application = useApplicationState();

  const { property, value, ...buttonProps } = props;
  const note = application.selection.note?.note;
  const isCurrentValue = note ? note.options[property] == value : false;
  const command = changeNoteAction({ [property]: isCurrentValue ? undefined : value });

  return <PaletteButton {...buttonProps} command={command} active={isCurrentValue} />;
}

const TogglePaletteButton = (
  props: Omit<PaletteButtonProps, "property" | "command"> & { property: BooleanNoteFeatures },
) => {
  const application = useApplicationState();
  const { property, ...buttonProps } = props;
  const command = toggleNoteFeatureAction(property);
  const isToggled = application.selection.note?.note.options[property] ?? false;

  return <PaletteButton {...buttonProps} command={command} active={isToggled} />;
};

const PaletteButton = (props: PaletteButtonProps) => {
  const { active, className, command, ...buttonProps } = props;
  const application = useApplicationState();
  return (
    <>
      <button
        {...buttonProps}
        title={command.name}
        onClick={() => application.dispatch(command)}
        className={`
          inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded border border-gray-600 p-1 text-xs font-thin hover:bg-gray-700
          ${className?.toString() ?? ""}
          ${active ? "bg-gray-600" : "bg-gray-800"}
        `}
      />
      <span class="hide-for-accessibility">{command.name}</span>
    </>
  );
};

const childElementForHarmonicButton = (style: HarmonicStyle): ComponentChildren => {
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
