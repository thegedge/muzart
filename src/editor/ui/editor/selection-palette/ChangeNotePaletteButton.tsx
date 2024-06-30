import * as notation from "../../../../notation";
import { changeNoteAction } from "../../../actions/editing/note/ChangeNote";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { PaletteButton } from "./PaletteButton";
import type { PaletteButtonProps } from "./PaletteButtonProps";

export function ChangeNotePaletteButton<PropertyT extends keyof notation.NoteOptions>(
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
