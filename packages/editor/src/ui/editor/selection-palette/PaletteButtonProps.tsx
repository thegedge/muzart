import type { HTMLAttributes } from "preact/compat";
import type { Command } from "../../../state/Application";

export type PaletteButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, "command" | "onClick"> & {
  active?: boolean;
  command: Command;
};
