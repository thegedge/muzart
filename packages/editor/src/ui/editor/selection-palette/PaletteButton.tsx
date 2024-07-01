import { clsx } from "clsx";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import type { PaletteButtonProps } from "./PaletteButtonProps";

export const PaletteButton = (props: PaletteButtonProps) => {
  const { active, className, command, ...buttonProps } = props;
  const application = useApplicationState();
  const classes = clsx(
    "inline-flex min-h-8 min-w-8 cursor-pointer items-center justify-center rounded border border-gray-600 p-1 text-xs font-thin hover:bg-gray-700",
    className?.toString(),
    active ? "bg-gray-600" : "bg-gray-800",
  );

  return (
    <>
      <button {...buttonProps} title={command.name} onClick={() => application.dispatch(command)} className={classes} />
      <span class="hide-for-accessibility">{command.name}</span>
    </>
  );
};
