import { type BooleanNoteFeatures, toggleNoteFeatureAction } from "../../../actions/editing/note/ToggleNoteFeature";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { PaletteButton } from "./PaletteButton";
import type { PaletteButtonProps } from "./PaletteButtonProps";

export const TogglePaletteButton = (
  props: Omit<PaletteButtonProps, "property" | "command"> & { property: BooleanNoteFeatures },
) => {
  const application = useApplicationState();
  const { property, ...buttonProps } = props;
  const command = toggleNoteFeatureAction(property);
  const isToggled = application.selection.note?.note.options[property] ?? false;

  return <PaletteButton {...buttonProps} command={command} active={isToggled} />;
};
