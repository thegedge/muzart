import { titleize } from "inflected";
import { observer } from "mobx-react-lite";
import { ComponentChildren } from "preact";
import { HTMLAttributes } from "preact/compat";
import * as notation from "../../../notation";
import { HarmonicStyle, NoteDynamic, NoteValue, NoteValueName } from "../../../notation";
import { changeNoteAction } from "../../actions/editing/ChangeNote";
import { changeNoteValueAction } from "../../actions/editing/ChangeNoteValue";
import { dotNoteAction } from "../../actions/editing/DotNote";
import { BooleanFeatures, toggleNoteFeatureAction } from "../../actions/editing/ToggleNoteFeature";
import { NoteValueIcon } from "../../resources/note_values";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const SelectionPalette = (_props: Record<string, never>) => {
  return (
    <div className="flex h-full min-w-96 max-w-72 flex-col gap-4 p-4 text-sm">
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

  return (
    <>
      <PaletteGroup name="Duration" className="flex flex-col border border-gray-600 px-2 pb-1">
        {Object.entries(NoteValueName).map(([key, value]) => {
          return (
            <PaletteButton
              key={key}
              className="max-h-8 max-w-8"
              tooltip={value}
              active={chord.value.name == value}
              onClick={() => application.dispatch(changeNoteValueAction(value))}
            >
              <NoteValueIcon noteValue={value} className="aspect-square w-full" />
            </PaletteButton>
          );
        })}

        <PaletteButton
          className="max-h-8 max-w-8"
          tooltip="Dot note"
          active={note.value.dots == 1}
          onClick={() => application.dispatch(dotNoteAction(note.value.dots == 1 ? 0 : 1))}
        >
          <NoteValueIcon noteValue={NoteValue.fromNumber(4).dot()} className="aspect-square w-full" />
        </PaletteButton>

        <PaletteButton
          className="max-h-8 max-w-8"
          tooltip="Double dot note"
          active={note.value.dots == 2}
          onClick={() => application.dispatch(dotNoteAction(note.value.dots == 2 ? 0 : 2))}
        >
          <NoteValueIcon noteValue={NoteValue.fromNumber(4).withDots(2)} className="aspect-square w-full" />
        </PaletteButton>
      </PaletteGroup>

      <PaletteGroup name="Effects" className="flex border border-gray-600 px-2 pb-1">
        <PaletteButton tooltip="Bend" onClick={() => application.state.toggleEditingBend()}>
          Bend
        </PaletteButton>
        <TogglePaletteButton tooltip="Vibrato" property="vibrato">
          Vibrato
        </TogglePaletteButton>
        <TogglePaletteButton tooltip="Let ring" property="letRing">
          Let Ring
        </TogglePaletteButton>
        <TogglePaletteButton tooltip="Dead note" property="dead">
          x
        </TogglePaletteButton>
        <TogglePaletteButton tooltip="Ghost note" property="ghost">
          ( )
        </TogglePaletteButton>
        <TogglePaletteButton tooltip="Staccato" property="staccato">
          Staccato
        </TogglePaletteButton>
        <TogglePaletteButton tooltip="Palm mute" property="palmMute">
          P.M.
        </TogglePaletteButton>
        <TogglePaletteButton tooltip="Hammer-on / pull-off" property="hammerOnPullOff">
          Hammer-on / Pull-off
        </TogglePaletteButton>
      </PaletteGroup>

      <PaletteGroup name="Harmonics" className="flex border border-gray-600 px-2 pb-1">
        {Object.entries(HarmonicStyle).map(([key, value]) => (
          <ChangeNotePaletteButton key={key} tooltip={value} property="harmonic" value={value}>
            {childElementForHarmonicButton(value)}
          </ChangeNotePaletteButton>
        ))}
      </PaletteGroup>

      <PaletteGroup name="Dynamics" className="flex border border-gray-600 px-2 pb-1">
        {Object.entries(NoteDynamic).map(([key, value]) => (
          <ChangeNotePaletteButton
            key={key}
            className="italic"
            tooltip={titleize(key)}
            property="dynamic"
            value={value}
          >
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

type PaletteButtonProps = HTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
  active?: boolean;
};

function ChangeNotePaletteButton<PropertyT extends keyof notation.NoteOptions>(
  props: Omit<PaletteButtonProps, "property"> & {
    property: PropertyT;
    value: notation.NoteOptions[PropertyT];
  },
) {
  const application = useApplicationState();

  const { property, value, ...buttonProps } = props;
  const note = application.selection.note?.note;
  const isCurrentValue = note ? note.options[property] == value : false;
  const onClick = () => {
    application.dispatch(changeNoteAction({ [property]: isCurrentValue ? undefined : value }));
  };

  return <PaletteButton {...buttonProps} onClick={onClick} active={isCurrentValue} />;
}

const TogglePaletteButton = (
  props: Omit<PaletteButtonProps, "property"> & { property: BooleanFeatures<notation.NoteOptions> },
) => {
  const application = useApplicationState();

  const { property, ...buttonProps } = props;
  const isToggled = application.selection.note?.note.options[property] ?? false;
  const onClick = () => {
    const action = toggleNoteFeatureAction(property).actionForState(application);
    application.dispatch(action);
  };

  return <PaletteButton {...buttonProps} onClick={onClick} active={isToggled} />;
};

const PaletteButton = (props: PaletteButtonProps) => {
  const { active, className, tooltip, ...buttonProps } = props;
  return (
    <>
      <button
        {...buttonProps}
        title={tooltip}
        className={`
          inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded border border-gray-600 p-1 text-xs font-thin hover:bg-gray-700
          ${className?.toString() ?? ""}
          ${active ? "bg-gray-600" : "bg-gray-800"}
        `}
      />
      <span class="hide-for-accessibility">{props.tooltip}</span>
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
